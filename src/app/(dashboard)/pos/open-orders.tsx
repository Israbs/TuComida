"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Bike,
  Check,
  Clock,
  MapPin,
  PackageOpen,
  Store,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatPrice } from "./types";
import type { ordersRouter } from "@/trpc/routers/orders";
import type { inferRouterOutputs } from "@trpc/server";

type OrdersRouter = inferRouterOutputs<typeof ordersRouter>;
type ActiveOrder = OrdersRouter["getActiveOrders"][number];

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Nueva",
    className: "bg-sky-100 text-sky-700",
  },
  PREPARING: {
    label: "En preparación",
    className: "bg-amber-100 text-amber-700",
  },
  READY: {
    label: "Lista",
    className: "bg-emerald-100 text-emerald-700",
  },
  DELIVERED: {
    label: "Entregado",
    className: "bg-indigo-100 text-indigo-700",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-muted text-muted-foreground",
  },
};

function orderLabel(o: { table: { number: number; name: string | null } | null; customerName: string | null }): string {
  if (o.table) return `Mesa ${o.table.number}`;
  if (o.customerName) return o.customerName;
  return "Para llevar";
}

function formatElapsed(from: Date, now: Date): string {
  const diff = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function OrderItems({ order }: { order: ActiveOrder }) {
  return (
    <ul className="space-y-1.5">
      {order.items.map((item) => {
        const addons = (item.addons as { name: string; priceCents: number }[] | null) ?? [];
        const removed = (item.removedIngredients as string[] | null) ?? [];
        return (
          <li key={item.id} className="text-sm">
            <p className="font-medium">
              <span className="text-muted-foreground">{item.quantity}×</span>{" "}
              {item.product.name}
            </p>
            {addons.length > 0 && (
              <p className="text-xs text-primary">
                + {addons.map((a) => a.name).join(", ")}
              </p>
            )}
            {removed.length > 0 && (
              <p className="text-xs text-amber-600">
                Sin {removed.join(", ")}
              </p>
            )}
            {item.notes && <p className="text-xs text-muted-foreground">📝 {item.notes}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function DeliveryInfo({ order }: { order: ActiveOrder }) {
  if (order.origin !== "ONLINE") return null;
  if (order.deliveryType === "DELIVERY") {
    return (
      <div className="mt-3 space-y-1 rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs dark:border-violet-500/30 dark:bg-violet-500/10">
        <p className="flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-400">
          <Bike className="size-3.5" />
          Delivery
        </p>
        {order.address && (
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="mt-0.5 size-3 shrink-0" />
            {order.address}
          </p>
        )}
        {order.mapsLink && (
          <a
            href={order.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline"
          >
            <MapPin className="size-3" />
            Ver ubicación en Google Maps
          </a>
        )}
        <p className="text-muted-foreground">
          Efectivo
          {order.cashGivenCents
            ? ` · paga con ${formatPrice(order.cashGivenCents)}`
            : " · pago exacto"}
          {order.cashGivenCents && order.cashGivenCents > order.totalCents
            ? ` · vuelto ${formatPrice(order.cashGivenCents - order.totalCents)}`
            : ""}
        </p>
      </div>
    );
  }
  return (
    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
      <Store className="size-3" />
      Retiro en el local
    </p>
  );
}

export function OpenOrdersPanel({
  orders,
  busy,
  onPay,
  onDeliver,
  onCancel,
}: {
  orders: ActiveOrder[];
  busy: boolean;
  onPay: (id: string) => void;
  onDeliver: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h2 className="font-semibold">Pedidos en curso</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PackageOpen className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay pedidos en curso.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
            const paid = Boolean(order.paidAt);
            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex items-start justify-between gap-2 border-b bg-muted/20 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">#{order.number}</span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {orderLabel(order)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatElapsed(order.createdAt, now)} · {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.className)}>
                      {meta.label}
                    </span>
                    {paid && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <BadgeCheck className="size-3.5" /> Cobrado
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  <OrderItems order={order} />
                  <DeliveryInfo order={order} />
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-base font-bold">
                      {formatPrice(order.totalCents)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 border-t bg-muted/20 px-4 py-3">
                  {!paid && order.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => onPay(order.id)}
                      className="flex-1"
                    >
                      <Banknote className="size-4" />
                      Cobrar
                    </Button>
                  )}
                  {order.status === "READY" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => onDeliver(order.id)}
                      className="flex-1"
                    >
                      <Check className="size-4" />
                      Entregar
                    </Button>
                  )}
                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onCancel(order.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}