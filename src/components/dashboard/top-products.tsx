import { money } from "@/lib/dashboard";

export type RankedItem = { name: string; value: number; count: number };

export function TopProducts({ items, total }: { items: RankedItem[]; total: number }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-4">
      {items.map((it, idx) => {
        const share = total > 0 ? (it.value / total) * 100 : 0;
        return (
          <li key={it.name}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={
                    idx === 0
                      ? "flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[11px] font-bold text-primary"
                      : "flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground"
                  }
                >
                  {idx + 1}
                </span>
                <span className="truncate font-medium">{it.name}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">
                {money(it.value)}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {it.count} {it.count === 1 ? "unidad" : "unidades"} ·{" "}
                  {share.toLocaleString("es-AR", { maximumFractionDigits: 0 })}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-chart-1 to-chart-2"
                style={{ width: `${(it.value / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}