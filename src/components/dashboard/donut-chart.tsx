import { moneyShort } from "@/lib/dashboard";

export type DonutSegment = { name: string; value: number; color: string };

type Arc = DonutSegment & { dash: number; offset: number };

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 60;
  const C = 2 * Math.PI * R;
  const visible = segments.filter((s) => s.value > 0);

  const arcs: Arc[] = visible.map((s, i) => {
    const frac = s.value / Math.max(total, 1);
    const prev = visible.slice(0, i).reduce((sum, p) => sum + p.value, 0);
    const prevFrac = prev / Math.max(total, 1);
    return { ...s, dash: frac * C, offset: -prevFrac * C };
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-[148px] shrink-0">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="var(--muted)" strokeWidth="24" />
          {arcs.map((a) => (
            <circle
              key={a.name}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth="24"
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={a.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-bold tabular-nums tracking-tight">{centerValue}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {centerLabel}
          </p>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {visible.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li key={s.name} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate text-muted-foreground">{s.name}</span>
              <span className="ml-auto shrink-0 font-semibold tabular-nums">
                {moneyShort(s.value)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {pct.toLocaleString("es-AR", { maximumFractionDigits: 0 })}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}