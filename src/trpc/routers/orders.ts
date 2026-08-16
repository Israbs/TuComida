import { router, protectedProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/prisma";
import { emitToTenant } from "@/lib/socket";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/enums";

const orderItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  addons: z.array(z.object({ id: z.string().min(1) })).default([]),
  removedIngredients: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  tableId: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  payNow: z.boolean().default(false),
  items: z.array(orderItemInput).min(1, "El pedido debe tener al menos un producto"),
});

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const SERVICE_ROLES = ["ADMIN", "CASHIER", "WAITER"] as const;

function requireServiceRole(role: string) {
  if (!SERVICE_ROLES.includes(role as (typeof SERVICE_ROLES)[number])) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tu rol no puede crear pedidos",
    });
  }
}

export const ordersRouter = router({
  /* ───── Crear pedido ───── */

  createOrder: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      requireServiceRole(ctx.user.role);
      const tenantId = ctx.user.tenantId;

      const productIds = [...new Set(input.items.map((i) => i.productId))];
      const products = await prisma.product.findMany({
        where: { tenantId, id: { in: productIds }, isActive: true },
        include: { addons: { where: { isActive: true } } },
      });
      if (products.length !== productIds.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Algún producto no existe o está inactivo" });
      }

      if (input.tableId) {
        const table = await prisma.table.findUnique({
          where: { id: input.tableId, tenantId },
        });
        if (!table) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La mesa seleccionada no existe" });
        }
      }

      let totalCents = 0;
      const resolvedItems = input.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        let lineAddons = 0;
        const snapshottedAddons: { id: string; name: string; priceCents: number }[] = [];
        for (const a of item.addons) {
          const addon = product.addons.find((x) => x.id === a.id);
          if (addon) {
            snapshottedAddons.push({
              id: addon.id,
              name: addon.name,
              priceCents: addon.priceCents,
            });
            lineAddons += addon.priceCents;
          }
        }
        const lineTotal = item.quantity * (product.priceCents + lineAddons);
        totalCents += lineTotal;
        return {
          ...item,
          unitPriceCents: product.priceCents,
          addons: snapshottedAddons,
        };
      });

      const order = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.update({
          where: { id: tenantId },
          data: { orderCounter: { increment: 1 } },
          select: { orderCounter: true },
        });

        const created = await tx.order.create({
          data: {
            tenantId,
            number: tenant.orderCounter,
            tableId: input.tableId ?? null,
            userId: ctx.user.id,
            customerName: input.customerName?.trim() || null,
            notes: input.notes?.trim() || null,
            origin: ctx.user.role === "WAITER" ? "WAITER" : "POS",
            status: "PENDING",
            totalCents,
            paidAt: input.payNow ? new Date() : null,
          },
        });

        for (const item of resolvedItems) {
          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              notes: item.notes?.trim() || null,
              ...(item.addons.length ? { addons: item.addons } : {}),
              ...(item.removedIngredients.length
                ? { removedIngredients: item.removedIngredients }
                : {}),
            },
          });
        }

        return created;
      });

      emitToTenant(tenantId, "orders:changed", {
        type: "order:created",
        id: order.id,
      });
      return order;
    }),

  /* ───── Cambiar estado ───── */

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        status: z.enum(["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      }
      if (!ALLOWED_TRANSITIONS[order.status].includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No se puede pasar de "${order.status}" a "${input.status}"`,
        });
      }

      const data: {
        status: OrderStatus;
        preparingAt?: Date;
        readyAt?: Date;
      } = { status: input.status };
      if (input.status === "PREPARING") data.preparingAt = new Date();
      if (input.status === "READY") data.readyAt = new Date();

      const updated = await prisma.order.update({
        where: { id: input.id },
        data,
      });

      emitToTenant(ctx.user.tenantId, "orders:changed", {
        type: "status:updated",
        id: updated.id,
        status: updated.status,
      });
      return updated;
    }),

  /* ───── Cobrar ───── */

  payOrder: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      }
      if (order.paidAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido ya está cobrado" });
      }
      if (order.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No se puede cobrar un pedido cancelado" });
      }

      const updated = await prisma.order.update({
        where: { id: input.id },
        data: { paidAt: new Date() },
      });

      emitToTenant(ctx.user.tenantId, "orders:changed", {
        type: "order:paid",
        id: updated.id,
      });
      return updated;
    }),

  /* ───── Pedidos activos (POS y KDS) ───── */

  getActiveOrders: protectedProcedure.query(async ({ ctx }) => {
    return prisma.order.findMany({
      where: {
        tenantId: ctx.user.tenantId,
        status: { in: ["PENDING", "PREPARING", "READY"] },
      },
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          include: { product: { select: { id: true, name: true } } },
        },
        table: { select: { number: true, name: true } },
        user: { select: { name: true } },
      },
    });
  }),

  /* ───── Últimos pedidos cobrados (POS, día actual) ───── */

  getRecentPaid: protectedProcedure.query(async ({ ctx }) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return prisma.order.findMany({
      where: {
        tenantId: ctx.user.tenantId,
        paidAt: { gte: start },
      },
      orderBy: { paidAt: "desc" },
      take: 20,
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        table: { select: { number: true, name: true } },
        user: { select: { name: true } },
      },
    });
  }),

  /* ───── Mesas activas (POS) ───── */

  getTables: protectedProcedure.query(async ({ ctx }) => {
    return prisma.table.findMany({
      where: { tenantId: ctx.user.tenantId, isActive: true },
      orderBy: { number: "asc" },
      select: { id: true, number: true, name: true },
    });
  }),
});