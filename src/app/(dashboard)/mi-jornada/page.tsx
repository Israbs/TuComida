"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";
import {
  CalendarClock,
  Clock,
  Coffee,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmtHM(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function fmtClock(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyJourneyPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.attendance.getMyStatus.useQuery();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useSocketEvent("attendance:changed", () => {
    utils.attendance.getMyStatus.invalidate();
  });

  const [punchAction, setPunchAction] = useState<"in" | "out" | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const punch = api.attendance.punch.useMutation({
    onSuccess: () => {
      toast.success(
        punchAction === "in" ? "Entrada marcada. ¡Buen trabajo!" : "Salida marcada. ¡Hasta mañana!",
      );
      utils.attendance.getMyStatus.invalidate();
      setPunchAction(null);
      setCode("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const closePunch = () => {
    if (submitting) return;
    setPunchAction(null);
    setCode("");
    setError("");
  };

  const submitPunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchAction) return;
    setError("");
    setSubmitting(true);
    punch.mutate(
      { action: punchAction, code: code.trim() },
      {
        onSettled: () => setSubmitting(false),
      },
    );
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const profile = data && data.hasProfile ? data : null;
  const open = profile?.today?.openPunch ?? null;
  const openSeconds = open ? (now - new Date(open.clockIn).getTime()) / 1000 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Mi Jornada</h1>
        <p className="text-sm text-muted-foreground">
          Tu turno de hoy, marcaciones y horas acumuladas de la semana.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : !profile ? (
        <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
          Tu usuario no tiene perfil de empleado asociado. Consultá con tu administrador.
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b bg-muted/40 px-5 py-3">
              <h2 className="text-sm font-semibold">Hoy</h2>
            </div>
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                {profile.today?.schedule ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    Tu turno:{" "}
                    <strong className="text-foreground">
                      {profile.today?.schedule.start} – {profile.today?.schedule.end}
                    </strong>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coffee className="size-4" />
                    Hoy es tu día libre
                  </div>
                )}

                {open ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-medium">Estás trabajando</span>
                    <span className="text-muted-foreground">
                      desde las {fmtClock(open.clockIn)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {profile.today?.hasWorkedToday
                      ? `Jornada de hoy: ${fmtHM(profile.today?.workedSeconds)}`
                      : "Hoy todavía no marcaste"}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-center sm:text-right">
                {open ? (
                  <>
                    <p className="text-3xl font-bold tabular-nums text-emerald-600">
                      {fmtHM(openSeconds)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full cursor-pointer"
                      onClick={() => {
                        setError("");
                        setCode("");
                        setPunchAction("out");
                      }}
                    >
                      <LogOut /> Marcar Salida
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {profile.today?.hasWorkedToday ? "¿Volvés a entrar?" : "¿Empezás tu turno?"}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 w-full cursor-pointer"
                      onClick={() => {
                        setError("");
                        setCode("");
                        setPunchAction("in");
                      }}
                    >
                      <LogIn /> Marcar Entrada
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Para marcar necesitás el código que ves en la pantalla del local.
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
              <h2 className="text-sm font-semibold">Semana</h2>
              <Badge variant="secondary">{fmtHM(profile.weekTotalSeconds)} acumulados</Badge>
            </div>
            <div className="divide-y">
              {profile.week.map((d) => {
                const isToday = d.date === todayKey;
                return (
                  <div
                    key={d.date}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 text-sm",
                      isToday && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "w-10 shrink-0 font-semibold",
                        isToday && "text-primary",
                      )}
                    >
                      {d.day}
                    </span>
                    <span className="flex-1 text-muted-foreground">
                      {d.scheduled ? (
                        <>
                          {d.scheduled.start} – {d.scheduled.end}
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    {d.isOpen ? (
                      <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                        En curso · {fmtHM(d.seconds)}
                      </Badge>
                    ) : d.seconds > 0 ? (
                      <span className="font-medium tabular-nums">{fmtHM(d.seconds)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <Dialog open={punchAction !== null} onOpenChange={(v) => !v && closePunch()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {punchAction === "in" ? "Marcar Entrada" : "Marcar Salida"}
            </DialogTitle>
            <DialogDescription>
              Escribí el código de 6 dígitos que ves en la pantalla del local.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitPunch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="punch-code">Código de pantalla</Label>
              <Input
                id="punch-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoFocus
                placeholder="••••••"
                className="text-center font-mono text-2xl tracking-[0.5em]"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closePunch}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Marcando..." : punchAction === "in" ? "Confirmar Entrada" : "Confirmar Salida"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}