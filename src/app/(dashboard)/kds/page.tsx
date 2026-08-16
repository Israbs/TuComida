"use client";

import { useEffect, useState } from "react";
import { ChefHat, Play, Check, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";
import type { ordersRouter } from "@/trpc/routers/orders";
import type { inferRouterOutputs } from "@trpc/server";

type OrdersRouter = inferRouterOutputs<typeof ordersRouter>;
type ActiveOrder = OrdersRouter["getActiveOrders"][number];

type ColumnId = "PENDING" | "PREPARING" | "READY";

const COLUMNS: {
  id: ColumnId;
  title: string;
  dot: string;
  empty: string;
}[] = [
  {
    id: "PENDING",
    title: "Nuevas",
    dot: "bg-sky-500",
    empty: "No hay comandas nuevas",
  },
  {
    id: "PREPARING",
    title: "En preparación",
    dot: "bg-amber-500",
    empty: "Nada en preparación",
  },
  {
    id: "READY",
    title: "Listas",
    dot: "bg-emerald-500",
    empty: "No hay comandas listas",
  },
];

function formatElapsed(from: Date, now: Date): string {
  const diff = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function orderLabel(o: ActiveOrder): string {
  if (o.table) return `Mesa ${o.table.number}`;
  if (o.customerName) return o.customerName;
  return "Para llevar";
}

function OrderCard({
  order,
  now,
  busy,
  onAction,
}: {
  order: ActiveOrder;
  now: Date;
  busy: boolean;
  onAction: (id: string, status: "PREPARING" | "READY" | "DELIVERED") => void;
}) {
  const action =
    order.status === "PENDING"
      ? { label: "Empezar", status: "PREPARING" as const, icon: Play }
      : order.status === "PREPARING"
        ? { label: "Listo", status: "READY" as const, icon: Check }
        : { label: "Entregado", status: "DELIVERED" as const, icon: PackageCheck };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.06)]",
        order.status === "PENDING" && "border-sky-200",
        order.status === "PREPARING" && "border-amber-300",
        order.status === "READY" && "border-emerald-300",
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div>
          <p className="text-lg font-extrabold leading-none">#{order.number}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {orderLabel(order)}
            {order.customerName && order.table
              ? ` · ${order.customerName}`
              : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary tabular-nums">
            {formatElapsed(order.createdAt, now)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            hace
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        <ul className="space-y-2">
          {order.items.map((item) => {
            const addons = (item.addons as { name: string; priceCents: number }[] | null) ?? [];
            const removed = (item.removedIngredients as string[] | null) ?? [];
            return (
              <li key={item.id}>
                <p className="text-[15px] font-semibold">
                  <span className="font-bold text-primary">
                    {item.quantity}
                  </span>
                  {"  "}
                  {item.product.name}
                </p>
                {addons.length > 0 && (
                  <p className="text-sm font-medium text-primary">
                    + {addons.map((a) => a.name).join(", ")}
                  </p>
                )}
                {removed.length > 0 && (
                  <p className="text-sm font-medium text-amber-600">
                    Sin {removed.join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm text-muted-foreground">📝 {item.notes}</p>
                )}
              </li>
            );
          })}
        </ul>
        {order.notes && (
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {order.notes}
          </p>
        )}
      </div>

      <div className="border-t bg-muted/20 px-4 py-3">
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => onAction(order.id, action.status)}
        >
          <action.icon className="size-4" />
          {action.label}
        </Button>
      </div>
    </div>
  );
}

export default function KDSPage() {
  const utils = api.useUtils();
  const { data: orders, isLoading } = api.orders.getActiveOrders.useQuery();
  const [now, setNow] = useState(() => new Date());

  useSocketEvent("orders:changed", () => {
    utils.orders.getActiveOrders.invalidate();
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const updateMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.getActiveOrders.invalidate();
      toast.success("Comanda actualizada");
    },
    onError: (err) => toast.error(err.message),
  });

  const byStatus = (status: ColumnId) =>
    (orders ?? []).filter((o) => o.status === status);

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col lg:h-[calc(100dvh-6.5rem)]">
      <div className="mb-4 flex items-center gap-2">
        <ChefHat className="size-5 text-primary" />
        <h1 className="text-xl font-bold">Pantalla de Cocina</h1>
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {orders?.length ?? 0} comandas activas
        </span>
      </div>

      {isLoading ? (
        <div className="grid flex-1 grid-cols-3 gap-4">
          {COLUMNS.map((c) => (
            <div key={c.id} className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = byStatus(col.id);
            return (
              <section
                key={col.id}
                className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-muted/20"
              >
                <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
                  <span className={cn("size-2.5 rounded-full", col.dot)} />
                  <h2 className="font-semibold">{col.title}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {list.length}
                  </span>
                </header>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                  {list.length === 0 ? (
                    <p className="pt-8 text-center text-sm text-muted-foreground">
                      {col.empty}
                    </p>
                  ) : (
                    list.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        now={now}
                        busy={updateMutation.isPending}
                        onAction={(id, status) =>
                          updateMutation.mutate({ id, status })
                        }
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}