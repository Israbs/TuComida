import { router, protectedProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
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

  createCategory: protectedProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.category.create({
        data: {
          tenantId: ctx.user.tenantId,
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        },
      });
    }),

  updateCategory: protectedProcedure
    .input(z.object({ id: z.string() }).merge(categorySchema))
    .mutation(async ({ ctx, input }) => {
      return prisma.category.update({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        data: {
          name: input.name,
          description: input.description,
          sortOrder: input.sortOrder,
        },
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.category.delete({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
    }),

  /* ───── Productos ───── */

  getProducts: protectedProcedure.query(async ({ ctx }) => {
    return prisma.product.findMany({
      where: { tenantId: ctx.user.tenantId },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  }),

  createProduct: protectedProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.product.create({
        data: {
          tenantId: ctx.user.tenantId,
          name: input.name,
          description: input.description,
          price: input.price,
          categoryId: input.categoryId,
          image: input.image,
          isActive: input.isActive,
        },
      });
    }),

  updateProduct: protectedProcedure
    .input(z.object({ id: z.string() }).merge(productSchema))
    .mutation(async ({ ctx, input }) => {
      return prisma.product.update({
        where: { id: input.id, tenantId: ctx.user.tenantId },
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          categoryId: input.categoryId,
          image: input.image,
          isActive: input.isActive,
        },
      });
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.product.delete({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });
    }),
});
