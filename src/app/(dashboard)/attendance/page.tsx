"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { UserRole } from "@/generated/prisma/enums";
import { Monitor, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtClock(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtHM(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function toLocalInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_META = {
  present: { label: "En el local", cls: "bg-emerald-600 text-white dark:bg-emerald-500" },
  late: { label: "Llegó tarde", cls: "border-amber-300 bg-amber-50 text-amber-800" },
  done: { label: "Terminó", cls: "border-muted bg-muted text-muted-foreground" },
  missing: { label: "Falta", cls: "border-destructive/30 bg-destructive/10 text-destructive" },
  rest: { label: "Día libre", cls: "border-muted bg-muted/50 text-muted-foreground" },
} as const;

type Row = {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  photoUrl: string | null;
  schedule: { day: number; start: string; end: string } | null;
  status: "present" | "late" | "done" | "missing" | "rest";
  clockIn: Date | null;
  clockOut: Date | null;
  isOpen: boolean;
  workedSeconds: number;
  punches: { id: string; clockIn: Date; clockOut: Date | null }[];
};

function useBoardData() {
  const { data, isLoading } = api.attendance.getTodayBoard.useQuery();
  return { data, isLoading };
}

type EditTarget = {
  userId: string;
  attendanceId?: string;
  clockIn: string;
  clockOut: string;
};

export default function AttendancePage() {
  const utils = api.useUtils();
  const { data, isLoading } = useBoardData();

  useSocketEvent("attendance:changed", () => {
    utils.attendance.getTodayBoard.invalidate();
  });

  const codeQuery = api.attendance.getCode.useQuery();
  const code = codeQuery.data?.code ?? "";
  const expiresIn = codeQuery.data?.expiresIn ?? 30;
  const expiresAt = codeQuery.dataUpdatedAt + expiresIn * 1000;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  useEffect(() => {
    if (remaining <= 0 && codeQuery.data) {
      codeQuery.refetch();
    }
  }, [remaining, codeQuery, codeQuery.data]);

  const progress = Math.max(0, Math.min(1, remaining / expiresIn));

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);

  const savePunch = api.attendance.savePunch.useMutation({
    onSuccess: () => {
      toast.success("Registro guardado");
      utils.attendance.getTodayBoard.invalidate();
      setEditTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const openEdit = (row: Row) => {
    const last = row.punches[row.punches.length - 1];
    setEditTarget({
      userId: row.userId,
      attendanceId: last?.id,
      clockIn: toLocalInput(last?.clockIn ?? new Date()),
      clockOut: toLocalInput(last?.clockOut ?? new Date()),
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    savePunch.mutate(
      {
        attendanceId: editTarget.attendanceId || undefined,
        userId: editTarget.userId,
        clockIn: new Date(editTarget.clockIn).toISOString(),
        clockOut: editTarget.clockOut ? new Date(editTarget.clockOut).toISOString() : null,
      },
      { onSettled: () => setSaving(false) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Asistencias</h1>
        <p className="text-sm text-muted-foreground">
          Pantalla de código para marcar entradas/salidas y monitoreo de quién está hoy.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="overflow-hidden rounded-2xl border bg-card lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3">
            <Monitor className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Código de marcación</h2>
          </div>
          <div className="space-y-4 p-5">
            {code ? (
              <div className="space-y-3">
                <p className="text-center font-mono text-5xl font-bold tracking-[0.25em] tabular-nums">
                  {code}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-250"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Cambia cada 30 segundos · quedan {remaining}s
                </p>
              </div>
            ) : (
              <Skeleton className="h-16 w-full" />
            )}
            <p className="text-xs text-muted-foreground">
              Mostrá esta pantalla en un lugar visible del local. Los empleados escriben el
              código vigente para marcar su entrada y salida. Así nadie puede marcarse desde
              su casa.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
            <h2 className="text-sm font-semibold">Hoy en el local</h2>
            <div className="flex gap-1.5">
              {!isLoading &&
                data &&
                ["present", "late"].map((s) => {
                  const count = data.filter((r) => r.status === s).length;
                  if (count === 0) return null;
                  return (
                    <Badge key={s} variant="secondary">
                      {count} {s === "present" ? "adentro" : "tarde"}
                    </Badge>
                  );
                })}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <div className="divide-y">
              {data?.map((row) => {
                const meta = STATUS_META[row.status];
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {row.photoUrl ? (
                        <Image
                          src={row.photoUrl}
                          alt={row.name}
                          width={36}
                          height={36}
                          unoptimized
                          className="size-full object-cover"
                        />
                      ) : (
                        row.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{row.name}</p>
                        <Badge className={cn("px-1.5 py-0 text-[10px]", meta.cls)}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.schedule
                          ? `Turno ${row.schedule.start} – ${row.schedule.end}`
                          : "Sin turno"}
                        {row.clockIn && (
                          <>
                            {" · "}Entrada {fmtClock(row.clockIn)}
                            {row.isOpen ? (
                              <span className="font-medium text-emerald-600">
                                {" · "} {fmtHM(row.workedSeconds)}
                              </span>
                            ) : row.clockOut ? (
                              <> · Salida {fmtClock(row.clockOut)}</>
                            ) : null}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Corregir ${row.name}`}
                      className="cursor-pointer"
                      onClick={() => openEdit(row)}
                    >
                      {row.punches.length > 0 ? <Pencil /> : <Plus />}
                    </Button>
                  </div>
                );
              })}
              {data?.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No hay empleados activos con usuario.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Corregir marcación</DialogTitle>
            <DialogDescription>
              Ajustá las horas de entrada y salida. Queda registrado quién realizó la
              corrección.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-in">Entrada</Label>
              <Input
                id="edit-in"
                type="datetime-local"
                value={editTarget?.clockIn ?? ""}
                onChange={(e) =>
                  setEditTarget((t) => (t ? { ...t, clockIn: e.target.value } : t))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-out">Salida</Label>
              <Input
                id="edit-out"
                type="datetime-local"
                value={editTarget?.clockOut ?? ""}
                onChange={(e) =>
                  setEditTarget((t) => (t ? { ...t, clockOut: e.target.value } : t))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar corrección"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}