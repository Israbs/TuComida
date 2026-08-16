import { router, protectedProcedure, adminProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/prisma";
import { emitToTenant } from "@/lib/socket";
import { removeUpload } from "@/lib/uploads";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const ingredientInput = z.object({
  name: z.string().min(1, "El nombre es requerido"),
});

const addonInput = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  priceCents: z.number().int().min(0, "El precio no puede ser negativo"),
});

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  priceCents: z.number().int().min(1, "El precio debe ser mayor a 0"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  ingredients: z.array(ingredientInput).default([]),
  addons: z.array(addonInput).default([]),
});

export const inventoryRouter = router({

  /* ───── Categorías ───── */

  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return prisma.category.findMany({
      where: { tenantId: ctx.user.tenantId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }),

  createCategory: adminProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      const category = await prisma.category.create({
        data: {
          tenantId: ctx.user.tenantId,
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        },
      });
      emitToTenant(ctx.user.tenantId, "inventory:changed", {
        type: "category:created",
        id: category.id,
      });
      return category;
    }),

  updateCategory: adminProcedure
    .input(z.object({ id: z.string() }).merge(categorySchema))
    .mutation(async ({ ctx, input }) => {
      const category = await prisma.category.update({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        data: {
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        },
      });
      emitToTenant(ctx.user.tenantId, "inventory:changed", {
        type: "category:updated",
        id: category.id,
      });
      return category;
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await prisma.category.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        include: { _count: { select: { products: true } } },
      });
      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Categoría no encontrada" });
      }
      if (category._count.products > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede eliminar: la categoría tiene productos asociados",
        });
      }
      const deleted = await prisma.category.delete({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
      emitToTenant(ctx.user.tenantId, "inventory:changed", {
        type: "category:deleted",
        id: input.id,
      });
      return deleted;
    }),

  /* ───── Productos ───── */

  getProducts: protectedProcedure.query(async ({ ctx }) => {
    return prisma.product.findMany({
      where: { tenantId: ctx.user.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        ingredients: { orderBy: { sortOrder: "asc" } },
        addons: { orderBy: { name: "asc" } },
      },
    });
  }),

  createProduct: adminProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      const product = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            tenantId: ctx.user.tenantId,
            name: input.name,
            description: input.description,
            priceCents: input.priceCents,
            categoryId: input.categoryId,
            image: input.image || null,
            isActive: input.isActive,
          },
        });
        for (const [i, ing] of input.ingredients.entries()) {
          await tx.ingredient.create({
            data: {
              tenantId: ctx.user.tenantId,
              productId: created.id,
              name: ing.name,
              sortOrder: i,
            },
          });
        }
        for (const addon of input.addons) {
          await tx.addon.create({
            data: {
              tenantId: ctx.user.tenantId,
              productId: created.id,
              name: addon.name,
              priceCents: addon.priceCents,
            },
          });
        }
        return created;
      });
      emitToTenant(ctx.user.tenantId, "inventory:changed", {
        type: "product:created",
        id: product.id,
      });
      return product;
    }),

  updateProduct: adminProcedure
    .input(z.object({ id: z.string() }).merge(productSchema))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.product.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }
      const product = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id: input.id, tenantId: ctx.user.tenantId },
          data: {
            name: input.name,
            description: input.description,
            priceCents: input.priceCents,
            categoryId: input.categoryId,
            image: input.image || null,
            isActive: input.isActive,
          },
        });
        await tx.ingredient.deleteMany({
          where: { productId: input.id, tenantId: ctx.user.tenantId },
        });
        for (const [i, ing] of input.ingredients.entries()) {
          await tx.ingredient.create({
            data: {
              tenantId: ctx.user.tenantId,
              productId: input.id,
              name: ing.name,
              sortOrder: i,
            },
          });
        }
        await tx.addon.deleteMany({
          where: { productId: input.id, tenantId: ctx.user.tenantId },
        });
        for (const addon of input.addons) {
          await tx.addon.create({
            data: {
              tenantId: ctx.user.tenantId,
              productId: input.id,
              name: addon.name,
              priceCents: addon.priceCents,
            },
          });
        }
        return updated;
      });
      if (existing.image !== (input.image || null)) {
        await removeUpload(existing.image, ctx.user.tenantId);
      }
      emitToTenant(ctx.user.tenantId, "inventory:changed", {
        type: "product:updated",
        id: product.id,
      });
      return product;
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      }
      const inOrders = await prisma.orderItem.count({
        where: { productId: input.id },
      });
      if (inOrders > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se puede eliminar: el producto está asociado a pedidos",
        });
      }
      const deleted = await prisma.product.delete({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
      await removeUpload(product.image, ctx.user.tenantId);
      emitToTenant(ctx.user.tenantId, "inventory:changed", {
        type: "product:deleted",
        id: input.id,
      });
      return deleted;
    }),
});