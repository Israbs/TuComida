import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Utensils } from "lucide-react";
import { prisma } from "@/lib/prisma";

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
  if (!tenant) return { title: "Carta no encontrada" };
  return {
    title: `Carta · ${tenant.name}`,
    description: `Menú digital de ${tenant.name}: productos y precios.`,
  };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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
            },
          },
        },
      },
    },
  });

  if (!tenant) notFound();

  const categories = tenant.categories.filter((c) => c.products.length > 0);

  return (
    <div className="min-h-screen bg-[#faf5ee]">
      <header className="sticky top-0 z-30 bg-[#0d0b09] text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-extrabold tracking-tight">
            {tenant.name}
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            Carta digital
          </span>
        </div>
      </header>

      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Menú digital
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {tenant.name}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Nuestra carta al día, con productos y precios para que elijas.
          </p>
        </div>
      </div>

      {categories.length > 0 ? (
        <>
          <div className="sticky top-14 z-20 border-b bg-[#faf5ee]/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
              {categories.map((c) => (
                <a
                  key={c.id}
                  href={`#cat-${c.id}`}
                  className="shrink-0 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {c.name}
                  <span className="ml-1.5 text-xs opacity-60">
                    {c.products.length}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <main className="mx-auto max-w-6xl space-y-14 px-4 py-12">
            {categories.map((c) => (
              <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-1.5 rounded-full bg-primary" />
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">
                      {c.name}
                    </h2>
                    {c.description && (
                      <p className="text-sm text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {c.products.map((p) => (
                    <article
                      key={p.id}
                      className="group overflow-hidden rounded-2xl border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/40 to-background">
                            <Utensils className="size-10 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {p.description}
                          </p>
                        )}
                        {p.ingredients.length > 0 && (
                          <p className="text-xs text-muted-foreground/80">
                            {p.ingredients.map((i) => i.name).join(" · ")}
                          </p>
                        )}
                        <p className="pt-1 text-lg font-bold text-primary">
                          {formatPrice(p.priceCents)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </>
      ) : (
        <main className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Utensils className="size-7" />
          </div>
          <p className="font-medium">Todavía no hay productos en la carta</p>
          <p className="text-sm text-muted-foreground">
            Pronto vas a poder elegir de este menú. ¡Volve en unos días!
          </p>
        </main>
      )}

      <footer className="border-t bg-[#0d0b09]">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 px-4 py-6 text-xs text-white/50">
          Carta digital generada con
          <Link href="/" className="font-bold text-white/70 hover:text-white">
            TuComida
          </Link>
        </p>
      </footer>
    </div>
  );
}