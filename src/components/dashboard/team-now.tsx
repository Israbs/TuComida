import { hoursBetween, money, timeShort } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export type TeamMember = {
  name: string;
  roleLabel: string;
  clockIn: Date;
  clockOut: Date | null;
  hourlyRate: number;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function TeamNow({
  members,
  totalCost,
  activeCount,
  workedCount,
}: {
  members: TeamMember[];
  totalCost: number;
  activeCount: number;
  workedCount: number;
}) {
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-lg font-bold tabular-nums">{activeCount}</p>
          <p className="text-xs text-muted-foreground">en el local ahora</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="text-lg font-bold tabular-nums">{money(totalCost)}</p>
          <p className="text-xs text-muted-foreground">costo de hoy</p>
        </div>
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nadie marcó entrada todavía hoy ({workedCount} en total).
        </p>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => {
            const active = !m.clockOut;
            const hours = m.clockOut
              ? hoursBetween(m.clockIn, m.clockOut)
              : hoursBetween(m.clockIn, new Date());
            return (
              <li key={m.name} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    desde {timeShort(m.clockIn)} · {hours.toFixed(1)}h
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground">{m.roleLabel}</p>
                  <p
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {active ? "en curso" : `${money(Math.round(hours * m.hourlyRate))}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}