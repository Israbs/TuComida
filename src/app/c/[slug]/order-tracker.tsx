"use client";

import Link from "next/link";
import {
  Banknote,
  Bike,
  Check,
  ChefHat,
  Loader2,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Store,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { formatPrice } from "./types";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  { status: "PENDING", label: "Recibido", hint: "Llegó a la cocina" },
  { status: "PREPARING", label: "En preparación", hint: "Lo están cocinando" },
  { status: "READY", label: "Listo", hint: "Pasa a retirarlo" },
  { status: "DELIVERED", label: "Entregado", hint: "Disfrutá tu pedido" },
] as const;

function stepIndex(status: string): number {
  const i = STEPS.findIndex((s) => s.status === status);
  return i === -1 ? 0 : i;
}

export function OrderTracker({ slug, id }: { slug: string; id: string }) {
  const { data, isLoading, isError } = api.orders.getOnlineOrder.useQuery(
    { slug, id },
    { refetchInterval: 4000 },
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Buscando tu pedido...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <ShoppingBag className="size-6" />
        </div>
        <p className="font-medium">No encontramos ese pedido</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Revisá el link o volvé al menú para hacer un pedido nuevo.
        </p>
        <Link
          href={`/c/${slug}`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
        >
          Volver al menú
        </Link>
      </div>
    );
  }

  const cancelled = data.status === "CANCELLED";
  const current = stepIndex(data.status);
  const done = data.status === "DELIVERED";

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-10">
      {/* Cabecera del pedido */}
      <div className="overflow-hidden rounded-3xl border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="bg-gradient-to-br from-primary via-chart-2 to-chart-4 p-6 text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                {cancelled ? "Pedido cancelado" : "Tu pedido"}
              </p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">
                #{data.number}
              </p>
            </div>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              {done ? (
                <PackageCheck className="size-7" />
              ) : cancelled ? (
                <ShoppingBag className="size-7" />
              ) : (
                <ChefHat className="size-7" />
              )}
            </div>
          </div>
          {data.customerName && (
            <p className="mt-3 text-sm text-primary-foreground/80">
              Pedido de <span className="font-semibold text-primary-foreground">{data.customerName}</span>
            </p>
          )}
        </div>

        {/* Progreso */}
        <div className="p-6">
          {cancelled ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              El local canceló este pedido. Si ya pagaste, contactate con el restaurante.
            </div>
          ) : (
            <>
              <ol className="relative">
                {STEPS.map((s, i) => {
                  const reached = i <= current;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <li key={s.status} className="relative flex gap-3 pb-8 last:pb-0">
                      {!isLast && (
                        <span
                          className={cn(
                            "absolute top-6 left-[15px] h-[calc(100%-1.5rem)] w-0.5 rounded-full",
                            i < current ? "bg-primary" : "bg-border",
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                          reached
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {reached ? <Check className="size-4" /> : i + 1}
                      </span>
                      <div className="pt-1">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            reached ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {s.label}
                          {i === current && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                              ahora
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.hint}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
                Esta página se actualiza sola. Guardá el link para seguir tu pedido.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Detalle */}
      {data.deliveryType === "DELIVERY" ? (
        <div className="rounded-3xl border bg-card p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <Bike className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Entrega a domicilio</h2>
          </div>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{data.address}</span>
            </li>
            {data.mapsLink && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <Link
                  href={data.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Abrir ubicación en Google Maps
                </Link>
              </li>
            )}
            <li className="flex items-start gap-2.5">
              <Banknote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                Pago en efectivo
                {data.cashGivenCents
                  ? ` · paga con ${formatPrice(data.cashGivenCents)}`
                  : " · pago exacto"}
                {data.cashGivenCents && data.cashGivenCents > data.totalCents
                  ? ` · vuelto ${formatPrice(data.cashGivenCents - data.totalCents)}`
                  : ""}
              </span>
            </li>
          </ul>
        </div>
      ) : (
        <div className="rounded-3xl border bg-card p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Retiro en el local</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pagás al retirar. Te avisamos por esta página cuando esté listo.
          </p>
        </div>
      )}

      <div className="rounded-3xl border bg-card p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <h2 className="text-sm font-semibold">Tu pedido</h2>
        <ul className="mt-3 divide-y">
          {data.items.map((it, idx) => {
            const addonNames = Array.isArray(it.addons)
              ? (it.addons as { name: string }[]).map((a) => a.name)
              : [];
            const removed = Array.isArray(it.removedIngredients)
              ? (it.removedIngredients as string[])
              : [];
            return (
              <li key={idx} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {it.quantity} × {it.product.name}
                  </p>
                  {addonNames.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">+ {addonNames.join(", ")}</p>
                  )}
                  {removed.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">sin {removed.join(", ")}</p>
                  )}
                  {it.notes && (
                    <p className="truncate text-xs italic text-muted-foreground">“{it.notes}”</p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPrice(it.unitPriceCents * it.quantity)}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-extrabold tabular-nums">{formatPrice(data.totalCents)}</span>
        </div>
        {data.notes && (
          <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Notas: {data.notes}
          </p>
        )}
      </div>

      <Link
        href={`/c/${slug}`}
        className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
      >
        <Utensils className="size-4" />
        Seguir viendo el menú
      </Link>
    </div>
  );
}