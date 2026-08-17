"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export type ScheduleEntry = { day: number; start: string; end: string };
export type ScheduleView = { day: number; enabled: boolean; start: string; end: string };

export function toScheduleView(value: ScheduleEntry[] | null | undefined): ScheduleView[] {
  const map = new Map<number, ScheduleEntry>();
  for (const e of value ?? []) map.set(e.day, e);
  return DAY_LABELS.map((_, day) => {
    const e = map.get(day);
    return {
      day,
      enabled: !!e,
      start: e?.start ?? "09:00",
      end: e?.end ?? "17:00",
    };
  });
}

export function toScheduleValue(view: ScheduleView[]): ScheduleEntry[] {
  return view
    .filter((d) => d.enabled && d.start && d.end)
    .map((d) => ({ day: d.day, start: d.start, end: d.end }));
}

export function ScheduleEditor({
  value,
  onChange,
}: {
  value: ScheduleView[];
  onChange: (value: ScheduleView[]) => void;
}) {
  const update = (day: number, patch: Partial<ScheduleView>) => {
    onChange(value.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {value.map((d) => (
          <div key={d.day} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update(d.day, { enabled: !d.enabled })}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                d.enabled
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:bg-muted",
              )}
              aria-pressed={d.enabled}
            >
              {DAY_LABELS[d.day]}
            </button>
            <div className={cn("flex flex-1 items-center gap-2 transition-opacity", !d.enabled && "opacity-40")}>
              <Input
                type="time"
                value={d.start}
                disabled={!d.enabled}
                onChange={(e) => update(d.day, { start: e.target.value })}
                className="w-auto flex-1"
                aria-label={`${DAY_LABELS[d.day]} inicio`}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                value={d.end}
                disabled={!d.enabled}
                onChange={(e) => update(d.day, { end: e.target.value })}
                className="w-auto flex-1"
                aria-label={`${DAY_LABELS[d.day]} fin`}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Toca el día para activarlo y definí su franja horaria.
      </p>
    </div>
  );
}