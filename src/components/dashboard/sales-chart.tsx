import { moneyShort } from "@/lib/dashboard";

export type DayPoint = { label: string; value: number };

export function SalesChart({ points }: { points: DayPoint[] }) {
  const W = 600;
  const H = 235;
  const padT = 30;
  const padB = 30;
  const padX = 14;
  const innerH = H - padT - padB;
  const max = Math.max(...points.map((p) => p.value), 1);
  const step = (W - padX * 2) / points.length;
  const barW = Math.min(step * 0.55, 58);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Ventas de los últimos 7 días"
    >
      <defs>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" />
          <stop offset="100%" stopColor="var(--chart-2)" />
        </linearGradient>
        <linearGradient id="barFillToday" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={W - padX}
          y1={padT + innerH * f}
          y2={padT + innerH * f}
          stroke="var(--border)"
          strokeDasharray="4 6"
          strokeWidth="1"
        />
      ))}

      {points.map((p, i) => {
        const h = Math.max((p.value / max) * innerH, p.value > 0 ? 5 : 2);
        const x = padX + i * step;
        const y = padT + innerH - h;
        const isLast = i === points.length - 1;
        return (
          <g key={p.label} role="img" aria-label={`${p.label}: ${moneyShort(p.value)}`}>
            <rect
              x={x + (step - barW) / 2}
              y={y}
              width={barW}
              height={h}
              rx="7"
              fill={isLast ? "url(#barFillToday)" : "url(#barFill)"}
              opacity={isLast ? 1 : 0.6}
            />
            {p.value > 0 && (
              <text
                x={x + step / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={isLast ? "var(--primary)" : "var(--muted-foreground)"}
              >
                {moneyShort(p.value)}
              </text>
            )}
            <text
              x={x + step / 2}
              y={H - 9}
              textAnchor="middle"
              fontSize="11"
              fontWeight={isLast ? 700 : 400}
              fill={isLast ? "var(--primary)" : "var(--muted-foreground)"}
            >
              {p.label}
              {isLast && " · hoy"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}