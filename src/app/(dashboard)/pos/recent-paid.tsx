"use client";

import { Banknote, CheckCircle2 } from "lucide-react";
import { formatPrice } from "./types";
import type { ordersRouter } from "@/trpc/routers/orders";
import type { inferRouterOutputs } from "@trpc/server";

type OrdersRouter = inferRouterOutputs<typeof ordersRouter>;
type RecentPaid = OrdersRouter["getRecentPaid"][number];

function orderLabel(o: {
  table: { number: number; name: string | null } | null;
  customerName: string | null;
}): string {
  if (o.table) return `Mesa ${o.table.number}`;
  if (o.customerName) return o.customerName;
  return "Para llevar";
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function OrderItems({ order }: { order: RecentPaid }) {
  return (
    <ul className="space-y-1.5">
      {order.items.map((item) => {
        const addons = (item.addons as { name: string; priceCents: number }[] | null) ?? [];
        return (
          <li key={item.id} className="text-sm">
            <p className="font-medium">
              <span className="text-muted-foreground">{item.quantity}×</span>{" "}
              {item.product.name}
            </p>
            {addons.length > 0 && (
              <p className="text-xs text-primary">+ {addons.map((a) => a.name).join(", ")}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function RecentPaidPanel({ orders }: { orders: RecentPaid[] }) {
  const total = orders.reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Banknote className="size-4 text-primary" />
          <h2 className="font-semibold">Cobrados hoy</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {orders.length}
          </span>
        </div>
        <span className="text-sm font-bold tabular-nums">{formatPrice(total)}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aún no se cobró ningún pedido hoy.
            </p>
          </div>
        ) : (
          orders.map((order) => (
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
                    Cobrado {order.paidAt ? `a las ${formatTime(order.paidAt)}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {formatPrice(order.totalCents)}
                </span>
              </div>
              <div className="px-4 py-3">
                <OrderItems order={order} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}