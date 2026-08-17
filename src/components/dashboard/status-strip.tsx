import type { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STATUS_FLOW: { status: OrderStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pendientes", color: "bg-amber-500" },
  { status: "PREPARING", label: "En preparación", color: "bg-orange-500" },
  { status: "READY", label: "Listas", color: "bg-sky-500" },
  { status: "DELIVERED", label: "Entregadas", color: "bg-emerald-500" },
  { status: "CANCELLED", label: "Canceladas", color: "bg-rose-500" },
];

export function StatusStrip({
  counts,
  total,
}: {
  counts: Record<OrderStatus, number>;
  total: number;
}) {
  const active = STATUS_FLOW.filter((s) => counts[s.status] > 0);
  return (
    <div>
      {total > 0 ? (
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {active.map((s) => (
            <div
              key={s.status}
              className={s.color}
              style={{ width: `${(counts[s.status] / total) * 100}%` }}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay órdenes hoy.</p>
      )}
      <ul className="mt-4 space-y-2">
        {STATUS_FLOW.map((s) => {
          const pct = total > 0 ? (counts[s.status] / total) * 100 : 0;
          return (
            <li key={s.status} className="flex items-center gap-2 text-sm">
              <span className={cn("size-2.5 rounded-full", s.color)} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums">{counts[s.status]}</span>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {pct.toLocaleString("es-AR", { maximumFractionDigits: 0 })}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}