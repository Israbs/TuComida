"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { DAY_LABELS, type ScheduleEntry } from "./schedule-editor";
import type { UserRole } from "@/generated/prisma/enums";
import {
  EmployeeFormDialog,
  type EditingEmployee,
  type EmployeePayload,
} from "./employee-form-dialog";

const ROLE_META = {
  CASHIER: { label: "Cajero", chip: "border-amber-300 bg-amber-50 text-amber-800" },
  COOK: { label: "Cocinero", chip: "border-primary/30 bg-primary/10 text-primary" },
  WAITER: { label: "Mesero", chip: "border-sky-300 bg-sky-50 text-sky-800" },
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function parseSchedule(raw: string | null | undefined): ScheduleEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScheduleEntry[]) : [];
  } catch {
    return [];
  }
}

function fmtDate(iso: string | Date | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

type EmployeeRow = Omit<EditingEmployee, "startDate" | "contractEnd"> & {
  startDate: Date | null;
  contractEnd: Date | null;
  user: { id: string; invitedAt: Date | null; passwordHash: string | null } | null;
};

function roleMeta(role: UserRole) {
  return (
    ROLE_META[role as keyof typeof ROLE_META] ?? {
      label: role,
      chip: "border-muted bg-muted text-foreground",
    }
  );
}

export function EmployeeList() {
  const utils = api.useUtils();
  const { data: employees, isLoading } = api.hr.getEmployees.useQuery();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditingEmployee | null>(null);
  const [deleting, setDeleting] = useState<EmployeeRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  useSocketEvent("hr:changed", () => {
    utils.hr.getEmployees.invalidate();
  });

  const copyOrLink = (mailSent: boolean, link: string | undefined) => {
    if (mailSent || !link) return;
    navigator.clipboard.writeText(link).catch(() => {});
    toast.info("Correo no configurado", {
      description: "Link de invitación copiado al portapapeles",
      action: {
        label: "Copiar",
        onClick: () => navigator.clipboard.writeText(link),
      },
    });
  };

  const createMutation = api.hr.createEmployee.useMutation({
    onSuccess: (res) => {
      utils.hr.getEmployees.invalidate();
      setFormOpen(false);
      toast.success("Empleado creado y usuario generado");
      copyOrLink(res.mailSent, res.inviteLink);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.hr.updateEmployee.useMutation({
    onSuccess: (res) => {
      utils.hr.getEmployees.invalidate();
      setFormOpen(false);
      const reInvited = res && "reInvited" in res && res.reInvited === true;
      toast.success(reInvited ? "Empleado actualizado y reinvitado" : "Empleado actualizado");
      if (reInvited && "inviteLink" in res) {
        copyOrLink(res.mailSent ?? false, res.inviteLink as string);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.hr.deleteEmployee.useMutation({
    onSuccess: () => {
      utils.hr.getEmployees.invalidate();
      toast.success("Empleado eliminado");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleteLoading(false);
    },
  });

  const resendMutation = api.hr.resendInvitation.useMutation({
    onSuccess: (res) => {
      utils.hr.getEmployees.invalidate();
      setResending(null);
      toast.success("Invitación reenviada");
      copyOrLink(res.mailSent, res.inviteLink);
    },
    onError: (err) => {
      toast.error(err.message);
      setResending(null);
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (employees ?? []).filter((e) => {
      if (!term) return true;
      return (
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        roleMeta(e.role).label.toLowerCase().includes(term)
      );
    });
  }, [employees, search]);

  const stats = useMemo(() => {
    const list = employees ?? [];
    return {
      total: list.length,
      active: list.filter((e) => e.isActive).length,
      pending: list.filter((e) => e.isActive && e.user && !e.user.passwordHash).length,
    };
  }, [employees]);

  const handleSave = async (payload: EmployeePayload) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Empleados", value: stats.total, icon: UserRound },
          { label: "Activos", value: stats.active, icon: CalendarDays },
          { label: "Invitaciones pendientes", value: stats.pending, icon: Send },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus /> Invitar Empleado
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <UserRound className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No hay empleados</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Ningún empleado coincide con tu búsqueda."
                : "Invita a tu equipo: se crea el usuario y llega la invitación por correo."}
            </p>
          </div>
          {!search && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus /> Invitar Empleado
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const schedule = parseSchedule(e.schedule);
            const pendingInvite = e.user && !e.user.passwordHash;
            const meta = roleMeta(e.role);
            return (
              <div
                key={e.id}
                className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)] animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {e.photoUrl ? (
                      <Image
                        src={e.photoUrl}
                        alt={e.name}
                        width={44}
                        height={44}
                        unoptimized
                        className="size-full object-cover"
                      />
                    ) : (
                      initials(e.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate font-semibold">{e.name}</h3>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <Mail className="size-3.5 shrink-0" />
                      {e.email}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Editar ${e.name}`}
                      className="cursor-pointer"
                      onClick={() => {
                        setEditing({
                          ...e,
                          startDate: e.startDate ? e.startDate.toISOString() : null,
                          contractEnd: e.contractEnd ? e.contractEnd.toISOString() : null,
                        });
                        setFormOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label={`Eliminar ${e.name}`}
                      className="cursor-pointer"
                      onClick={() => setDeleting(e)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${meta.chip}`}>
                    {meta.label}
                  </span>
                  {pendingInvite ? (
                    <Badge variant="secondary">Invitación pendiente</Badge>
                  ) : e.isActive ? (
                    <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                  {e.idDocUrl && (
                    <a
                      href={e.idDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <FileText className="size-3.5" />
                      Ver documento
                    </a>
                  )}
                  {e.contractEnd && (
                    <span className="rounded-lg border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Contrato hasta {fmtDate(e.contractEnd)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <CircleDollarSign className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">
                      ${(e.hourlyRateCents / 100).toFixed(2)}
                      <span className="text-muted-foreground">/h</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{fmtDate(e.startDate) ?? "Sin fecha"}</span>
                  </div>
                </div>

                <div className="min-h-6">
                  {schedule.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {schedule.map((s) => (
                        <span
                          key={s.day}
                          className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {DAY_LABELS[s.day]} {s.start}–{s.end}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin horario definido</p>
                  )}
                </div>

                {pendingInvite && (
                  <div className="mt-auto border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cursor-pointer"
                      disabled={resending === e.id}
                      onClick={() => { setResending(e.id); resendMutation.mutate({ id: e.id }); }}
                    >
                      <RotateCcw /> Reenviar invitación
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EmployeeFormDialog
        key={formOpen ? (editing?.id ?? "new-employee") : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => { if (!v) setDeleting(null); }}
        title="Eliminar empleado"
        description={
          deleting
            ? `¿Seguro que querés eliminar a "${deleting.name}"? Su usuario se eliminará si no tiene pedidos ni turnos.`
            : ""
        }
        loading={deleteLoading}
        onConfirm={() => {
          if (!deleting) return;
          setDeleteLoading(true);
          deleteMutation.mutate({ id: deleting.id });
        }}
      />
    </div>
  );
}