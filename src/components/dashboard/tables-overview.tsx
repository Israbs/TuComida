import { money } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export type TablePill = { number: number; occupied: boolean };

export function TablesOverview({
  tables,
  occupiedCount,
  freeCount,
  openRevenue,
}: {
  tables: TablePill[];
  occupiedCount: number;
  freeCount: number;
  openRevenue: number;
}) {
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-rose-500/10 p-3">
          <p className="text-lg font-bold tabular-nums">{occupiedCount}</p>
          <p className="text-xs text-rose-600 dark:text-rose-400">ocupadas</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-3">
          <p className="text-lg font-bold tabular-nums">{freeCount}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">libres</p>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay mesas activas.</p>
      ) : (
        <div className="grid grid-cols-6 gap-2">
          {tables.map((t) => (
            <div
              key={t.number}
              title={t.occupied ? `Mesa ${t.number} · ocupada` : `Mesa ${t.number} · libre`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl text-xs font-bold tabular-nums",
                t.occupied
                  ? "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/30 dark:text-rose-400"
                  : "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400",
              )}
            >
              {t.number}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Consumo abierto en mesas</span>
        <span className="font-semibold tabular-nums">{money(openRevenue)}</span>
      </div>
    </div>
  );
}