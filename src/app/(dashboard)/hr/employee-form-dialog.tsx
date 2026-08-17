"use client";

import { useState } from "react";
import type { UserRole } from "@/generated/prisma/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScheduleEditor,
  toScheduleView,
  toScheduleValue,
  type ScheduleEntry,
} from "./schedule-editor";
import { ImageUpload } from "@/app/(dashboard)/inventory/image-upload";

export type EmployeePayload = {
  name: string;
  email: string;
  role: "CASHIER" | "COOK" | "WAITER";
  phone?: string;
  photoUrl?: string;
  idDocUrl?: string;
  contractEnd?: string;
  hourlyRateCents: number;
  startDate?: string;
  schedule?: string;
  isActive: boolean;
};

export type EditingEmployee = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  photoUrl: string | null;
  idDocUrl: string | null;
  contractEnd: string | null;
  hourlyRateCents: number;
  startDate: string | null;
  schedule: string | null;
  isActive: boolean;
};

const ROLE_OPTIONS = [
  { value: "CASHIER", label: "Cajero" },
  { value: "COOK", label: "Cocinero" },
  { value: "WAITER", label: "Mesero" },
] as const;

function parseSchedule(raw: string | null | undefined): ScheduleEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScheduleEntry[]) : [];
  } catch {
    return [];
  }
}

function SectionHeading({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3.5 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none",
          checked ? "bg-primary" : "bg-muted-foreground/25",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-[22px]",
          )}
        />
      </button>
    </div>
  );
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EditingEmployee | null;
  onSave: (payload: EmployeePayload) => Promise<void>;
}) {
  const [name, setName] = useState(employee?.name ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [role, setRole] = useState<EmployeePayload["role"]>(
    (employee?.role ?? "WAITER") as EmployeePayload["role"],
  );
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(employee?.photoUrl ?? null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<string | null>(employee?.idDocUrl ?? null);
  const [pendingIdDoc, setPendingIdDoc] = useState<File | null>(null);
  const [contractEnd, setContractEnd] = useState(
    employee?.contractEnd ? new Date(employee.contractEnd).toISOString().slice(0, 10) : "",
  );
  const [hourlyRate, setHourlyRate] = useState(
    employee ? String((employee.hourlyRateCents / 100).toFixed(2)) : "",
  );
  const [startDate, setStartDate] = useState(
    employee?.startDate ? new Date(employee.startDate).toISOString().slice(0, 10) : "",
  );
  const [isActive, setIsActive] = useState(employee?.isActive ?? true);
  const [schedule, setSchedule] = useState(() =>
    toScheduleView(parseSchedule(employee?.schedule)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file: File): Promise<string | null> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) return null;
    return (json.url as string) ?? null;
  };

  const handlePhotoChange = (file: File | null) => {
    if (file) {
      setPendingPhoto(file);
      return;
    }
    setPendingPhoto(null);
    setPhoto(null);
  };

  const handleIdDocChange = (file: File | null) => {
    if (file) {
      setPendingIdDoc(file);
      return;
    }
    setPendingIdDoc(null);
    setIdDoc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const rate = parseFloat(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate < 0) {
      setError("El salario por hora debe ser mayor o igual a 0");
      return;
    }
    const scheduleValue = toScheduleValue(schedule);
    setSaving(true);
    setError("");
    try {
      let finalPhoto = photo;
      let finalIdDoc = idDoc;
      let uploadedPhoto: string | null = null;
      let uploadedIdDoc: string | null = null;
      if (pendingPhoto) {
        finalPhoto = await uploadImage(pendingPhoto);
        if (!finalPhoto) throw new Error("No se pudo subir la foto");
        uploadedPhoto = finalPhoto;
      }
      if (pendingIdDoc) {
        finalIdDoc = await uploadImage(pendingIdDoc);
        if (!finalIdDoc) throw new Error("No se pudo subir el documento");
        uploadedIdDoc = finalIdDoc;
      }
      try {
        await onSave({
          name: name.trim(),
          email: email.trim(),
          role,
          phone: phone.trim() || undefined,
          photoUrl: finalPhoto ?? undefined,
          idDocUrl: finalIdDoc ?? undefined,
          contractEnd: contractEnd || undefined,
          hourlyRateCents: Math.round(rate * 100),
          startDate: startDate || undefined,
          schedule: scheduleValue.length > 0 ? JSON.stringify(scheduleValue) : undefined,
          isActive,
        });
      } catch (err) {
        for (const url of [uploadedPhoto, uploadedIdDoc]) {
          if (url) {
            fetch("/api/upload", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            }).catch(() => {});
          }
        }
        throw err;
      }
    } catch {
      setError("No se pudo guardar el empleado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,46rem)] max-h-[min(92dvh,46rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{employee ? "Editar Empleado" : "Invitar Empleado"}</DialogTitle>
          <DialogDescription>
            {employee
              ? "Actualizá los datos del empleado."
              : "Se crea un usuario con acceso al sistema y se envía la invitación por correo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <section className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  <Label>Foto</Label>
                  <ImageUpload
                    value={photo}
                    pending={pendingPhoto}
                    onChange={handlePhotoChange}
                    aspect="aspect-square"
                    alt="Foto del empleado"
                  />
                  <p className="px-1 text-xs text-muted-foreground">
                    JPG, PNG o WEBP. Máx. 5 MB.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ef-name">Nombre completo</Label>
                    <Input
                      id="ef-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre y apellido"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ef-email">Correo electrónico</Label>
                      <Input
                        id="ef-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ef-role">Rol</Label>
                      <Select
                        value={role}
                        onValueChange={(v) => {
                          const found = ROLE_OPTIONS.find((o) => o.value === v);
                          if (found) setRole(found.value);
                        }}
                      >
                        <SelectTrigger id="ef-role">
                          <SelectValue>
                            {(value) =>
                              ROLE_OPTIONS.find((o) => o.value === value)?.label ??
                              "Seleccionar rol"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ef-phone">Teléfono</Label>
                      <Input
                        id="ef-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ef-rate">Salario por hora ($)</Label>
                      <Input
                        id="ef-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="8.50"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ef-start">Fecha de inicio</Label>
                      <Input
                        id="ef-start"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="self-end">
                      <Switch
                        checked={isActive}
                        onChange={setIsActive}
                        label="Empleado activo"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionHeading
                title="Documentación"
                hint="Opcional — documento de identidad y duración del contrato."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Documento de identidad</Label>
                  <ImageUpload
                    value={idDoc}
                    pending={pendingIdDoc}
                    onChange={handleIdDocChange}
                    aspect="aspect-[4/3]"
                    alt="Documento de identidad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ef-contract">Fin de contrato</Label>
                  <Input
                    id="ef-contract"
                    type="date"
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                  />
                  <p className="px-1 text-xs text-muted-foreground">
                    Fecha en que termina el contrato, si es por tiempo determinado.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <SectionHeading
                title="Horario semanal"
                hint="Tocá cada día para activarlo y definí su franja."
              />
              <ScheduleEditor value={schedule} onChange={setSchedule} />
            </section>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3.5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : employee ? "Guardar Cambios" : "Crear e Invitar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}