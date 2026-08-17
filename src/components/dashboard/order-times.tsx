import { Flame, Timer } from "lucide-react";
import { minutesLabel } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export type TimePhase = {
  key: string;
  label: string;
  color: string;
  ms: number;
};

export function OrderTimes({
  totalMs,
  phases,
  measured,
  trend,
}: {
  totalMs: number | null;
  phases: TimePhase[];
  measured: number;
  trend: number | null;
}) {
  if (totalMs === null || phases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay pedidos completos hoy para medir tiempos.
      </p>
    );
  }

  const slowest = phases.reduce((a, b) => (b.ms > a.ms ? b : a), phases[0]);
  const slower = trend !== null && trend > 0;
  const faster = trend !== null && trend < 0;

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col justify-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            promedio total
          </span>
        </div>
        <p className="text-4xl font-extrabold tabular-nums tracking-tight">
          {minutesLabel(totalMs)}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {trend === null ? (
            <span className="text-muted-foreground">sin datos de la semana anterior</span>
          ) : (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold tabular-nums",
                  slower
                    ? "text-rose-600 dark:text-rose-400"
                    : faster
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                )}
              >
                {slower ? "▲" : faster ? "▼" : "◆"} {Math.abs(trend).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
              </span>
              <span className="text-muted-foreground">
                {slower ? "más lento" : faster ? "más rápido" : "igual"} que la semana pasada
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          desde que se crea hasta que se cobra · {measured}{" "}
          {measured === 1 ? "pedido completo" : "pedidos completos"} hoy
        </p>
      </div>

      <div className="space-y-4">
        {phases.map((ph) => {
          const isSlowest = ph.key === slowest.key;
          const share = totalMs > 0 ? (ph.ms / totalMs) * 100 : 0;
          return (
            <div key={ph.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2.5 shrink-0 rounded-full", ph.color)} />
                  <span className="truncate font-medium">{ph.label}</span>
                  {isSlowest && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                      <Flame className="size-3" />
                      la más lenta
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {minutesLabel(ph.ms)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({share.toLocaleString("es-AR", { maximumFractionDigits: 0 })}%)
                  </span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", ph.color)}
                  style={{ width: `${Math.min(share, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}