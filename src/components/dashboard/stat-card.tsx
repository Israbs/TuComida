import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">sin datos previos</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        up
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      )}
    >
      <ArrowUpRight className={cn("size-3.5", !up && "rotate-180")} />
      {Math.abs(value).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName,
  trend,
  trendLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: number | null;
  trendLabel?: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:scale-105",
            iconClassName ?? "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>
      {(trend !== undefined || sub) && (
        <div className="mt-3 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {trend !== undefined && (
            <>
              <TrendBadge value={trend} />
              {trendLabel && <span>{trendLabel}</span>}
            </>
          )}
          {sub && <span className="truncate">{sub}</span>}
        </div>
      )}
    </div>
  );
}
