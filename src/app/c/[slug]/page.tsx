import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrderApp } from "./order-app";
import type { OnlineCategory } from "./types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!tenant) return { title: "Pedidos no encontrados" };
  return {
    title: `Pedidos · ${tenant.name}`,
    description: `Hacé tu pedido online en ${tenant.name}.`,
  };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          products: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              priceCents: true,
              image: true,
              ingredients: {
                orderBy: { sortOrder: "asc" },
                select: { name: true },
              },
              addons: {
                where: { isActive: true },
                orderBy: { name: "asc" },
                select: {
                  id: true,
                  name: true,
                  priceCents: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tenant) notFound();

  const categories: OnlineCategory[] = tenant.categories
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      products: c.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        image: p.image,
        ingredients: p.ingredients.map((i) => i.name),
        addons: p.addons,
      })),
    }));

  return (
    <OrderApp slug={slug} tenantName={tenant.name} categories={categories} />
  );
}