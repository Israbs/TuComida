import type { OrderOrigin, OrderStatus } from "@/generated/prisma/enums";
import { ORIGIN_LABEL, money } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { RelativeTime } from "./relative-time";

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  PREPARING: "bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-400",
  READY: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  DELIVERED: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  CANCELLED: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
};

export type RecentOrder = {
  number: number;
  customerName: string | null;
  status: OrderStatus;
  origin: OrderOrigin;
  totalCents: number;
  createdAt: Date;
  itemCount: number;
  tableLabel: string | null;
};

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin pedidos todavía.</p>;
  }
  return (
    <ul className="divide-y">
      {orders.map((o) => (
        <li key={o.number} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold tabular-nums",
              STATUS_BADGE[o.status],
            )}
          >
            {o.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {o.customerName ?? o.tableLabel ?? `Pedido #${o.number}`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {o.itemCount} {o.itemCount === 1 ? "producto" : "productos"} ·{" "}
              {ORIGIN_LABEL[o.origin]}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">{money(o.totalCents)}</p>
            <p className="text-xs text-muted-foreground">
              <RelativeTime date={o.createdAt} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}