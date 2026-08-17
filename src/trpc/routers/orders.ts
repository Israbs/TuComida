import { router, protectedProcedure, publicProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/prisma";
import { emitToTenant } from "@/lib/socket";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/enums";

const orderItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  addons: z.array(z.object({ id: z.string().min(1) })).default([]),
  removedIngredients: z.array(z.string()).default([]),
  notes: z.string().trim().max(200).optional(),
});

const createOrderSchema = z.object({
  tableId: z.string().optional(),
  customerName: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(300).optional(),
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

type ResolvableProduct = {
  id: string;
  priceCents: number;
  addons: { id: string; name: string; priceCents: number }[];
};

function resolveItems(products: ResolvableProduct[], items: z.infer<typeof orderItemInput>[]) {
  let totalCents = 0;
  const resolvedItems = items.map((item) => {
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
    totalCents += item.quantity * (product.priceCents + lineAddons);
    return {
      ...item,
      unitPriceCents: product.priceCents,
      addons: snapshottedAddons,
    };
  });
  return { totalCents, resolvedItems };
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

      const { totalCents, resolvedItems } = resolveItems(products, input.items);

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

  /* ───── Pedido online (público) ───── */

  createOnlineOrder: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        customerName: z.string().trim().max(80).optional(),
        notes: z.string().trim().max(300).optional(),
        deliveryType: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
        address: z.string().trim().max(200).optional(),
        mapsLink: z.string().trim().max(500).optional(),
        cashGivenCents: z.number().int().min(0).optional(),
        items: z
          .array(orderItemInput)
          .min(1, "El pedido debe tener al menos un producto")
          .max(30),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.deliveryType === "DELIVERY" && !input.address) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Para delivery necesitamos la dirección",
        });
      }
      if (input.deliveryType !== "DELIVERY") {
        input.address = undefined;
        input.mapsLink = undefined;
        input.cashGivenCents = undefined;
      }

      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Restaurante no encontrado" });
      }

      const productIds = [...new Set(input.items.map((i) => i.productId))];
      const products = await prisma.product.findMany({
        where: { tenantId: tenant.id, id: { in: productIds }, isActive: true },
        include: { addons: { where: { isActive: true } } },
      });
      if (products.length !== productIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Algún producto no está disponible en este momento",
        });
      }

      const { totalCents, resolvedItems } = resolveItems(products, input.items);

      const order = await prisma.$transaction(async (tx) => {
        const counter = await tx.tenant.update({
          where: { id: tenant.id },
          data: { orderCounter: { increment: 1 } },
          select: { orderCounter: true },
        });

        const created = await tx.order.create({
          data: {
            tenantId: tenant.id,
            number: counter.orderCounter,
            userId: null,
            customerName: input.customerName || null,
            notes: input.notes || null,
            origin: "ONLINE",
            status: "PENDING",
            totalCents,
            deliveryType: input.deliveryType,
            address: input.address || null,
            mapsLink: input.mapsLink || null,
            cashGivenCents: input.cashGivenCents ?? null,
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

      emitToTenant(tenant.id, "orders:changed", {
        type: "order:created",
        id: order.id,
      });
      return {
        id: order.id,
        number: order.number,
        status: order.status,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
        deliveryType: order.deliveryType,
        address: order.address,
        mapsLink: order.mapsLink,
        cashGivenCents: order.cashGivenCents,
      };
    }),

  getOnlineOrder: publicProcedure
    .input(z.object({ slug: z.string().min(1), id: z.string().min(1) }))
    .query(async ({ input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Restaurante no encontrado" });
      }

      const order = await prisma.order.findUnique({
        where: { id: input.id, tenantId: tenant.id },
        select: {
          number: true,
          status: true,
          totalCents: true,
          createdAt: true,
          customerName: true,
          notes: true,
          deliveryType: true,
          address: true,
          mapsLink: true,
          cashGivenCents: true,
          items: {
            select: {
              quantity: true,
              unitPriceCents: true,
              addons: true,
              removedIngredients: true,
              notes: true,
              product: { select: { name: true } },
            },
          },
        },
      });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      }
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
        OR: [
          { status: { in: ["PENDING", "PREPARING", "READY"] } },
          { status: "DELIVERED", paidAt: null },
        ],
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
    const tables = await prisma.table.findMany({
      where: { tenantId: ctx.user.tenantId, isActive: true },
      orderBy: { number: "asc" },
      include: {
        orders: {
          where: {
            paidAt: null,
            status: { not: "CANCELLED" },
          },
          select: {
            id: true,
            totalCents: true,
          },
        },
      },
    });

    return tables.map((t) => {
      const activeOrders = t.orders;
      const isOccupied = activeOrders.length > 0;
      const currentTotalCents = activeOrders.reduce((sum, o) => sum + o.totalCents, 0);

      return {
        id: t.id,
        number: t.number,
        name: t.name,
        capacity: t.capacity,
        posX: t.posX,
        posY: t.posY,
        qrCode: t.qrCode,
        status: isOccupied ? ("OCCUPIED" as const) : ("FREE" as const),
        currentTotal: (currentTotalCents / 100).toFixed(2),
        activeOrderIds: activeOrders.map((o) => o.id),
      };
    });
  }),

  /* ───── CREAR MESA ───── */

  createTable: protectedProcedure
  .input(
    z.object({
      number: z.number().int().positive().optional(),
      name: z.string().optional(),
      capacity: z.number().int().min(1).default(4),
      posX: z.number().int().default(0),
      posY: z.number().int().default(0),
    })
  )
  .mutation(async ({ ctx, input }) => {
    requireServiceRole(ctx.user.role);
    const tenantId = ctx.user.tenantId;

    // Obtener los números de todas las mesas activas y ver huecos libres
    const activeTables = await prisma.table.findMany({
      where: { tenantId, isActive: true },
      select: { number: true },
      orderBy: { number: "asc" },
    });

    const activeNumbers = new Set(activeTables.map((t) => t.number));

    let targetNumber = input.number;

    if (!targetNumber || activeNumbers.has(targetNumber)) {
      let nextAvailable = 1;
      while (activeNumbers.has(nextAvailable)) {
        nextAvailable++;
      }
      targetNumber = nextAvailable;
    }

    // Verificamos si existe
    const existingTable = await prisma.table.findUnique({
      where: {
        tenantId_number: {
          tenantId,
          number: targetNumber,
        },
      },
    });

    // reactivamos antigua inactiva
    if (existingTable) {
      const reactivatedTable = await prisma.table.update({
        where: { id: existingTable.id },
        data: {
          isActive: true,
          name: input.name?.trim() || null,
          capacity: input.capacity,
          posX: input.posX,
          posY: input.posY,
        },
      });

      emitToTenant(tenantId, "tables:changed", { type: "table:created" });
      return reactivatedTable;
    }
    
    const newTable = await prisma.table.create({
      data: {
        tenantId,
        number: targetNumber,
        name: input.name?.trim() || null,
        capacity: input.capacity,
        posX: input.posX,
        posY: input.posY,
        isActive: true,
      },
    });

    emitToTenant(tenantId, "tables:changed", { type: "table:created" });
    return newTable;
  }),

  /* ───── GUARDAR POSICIONES DE MESAS ───── */

  updateTablePositions: protectedProcedure
  .input(
    z.array(
      z.object({
        id: z.string().min(1),
        posX: z.number().int(),
        posY: z.number().int(),
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    requireServiceRole(ctx.user.role);
    const tenantId = ctx.user.tenantId;

    const updates = input.map((table) =>
      prisma.table.updateMany({
        where: { id: table.id, tenantId },
        data: { posX: table.posX, posY: table.posY },
      })
    );

    await prisma.$transaction(updates);

    emitToTenant(tenantId, "tables:changed", { type: "positions:updated" });
    return { success: true };
  }),

  /* ───── ELIMINAR MESA ───── */

  deleteTable: protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    requireServiceRole(ctx.user.role);
    const tenantId = ctx.user.tenantId;

    // Desactivar la mesa directamente
    await prisma.table.update({
      where: { id: input.id, tenantId },
      data: { isActive: false },
    });

    emitToTenant(tenantId, "tables:changed", { type: "table:deleted" });
    return { success: true };
  }),

});