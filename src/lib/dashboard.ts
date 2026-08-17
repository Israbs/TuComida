import type { OrderOrigin, OrderStatus } from "@/generated/prisma/enums";

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function moneyShort(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function pctChange(cur: number, prev: number): number | null {
  if (prev <= 0) return cur > 0 ? null : 0;
  return ((cur - prev) / prev) * 100;
}

interface AddonSnap {
  name?: string;
  priceCents?: number;
}

export function sumAddonsPrice(addons: unknown): number {
  if (!Array.isArray(addons)) return 0;
  return addons.reduce((acc: number, a) => {
    const snap = a as AddonSnap;
    return acc + (typeof snap?.priceCents === "number" ? snap.priceCents : 0);
  }, 0);
}

export function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function timeShort(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function weekdayShort(date: Date): string {
  const label = date.toLocaleDateString("es-AR", { weekday: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export function spanishDateLong(date: Date): string {
  return date
    .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^./, (c) => c.toUpperCase());
}

export function hoursBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}

export function minutesLabel(ms: number): string {
  return `${(ms / 60000).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })} min`;
}

export function meanMs(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PREPARING: "En preparación",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const ORIGIN_LABEL: Record<OrderOrigin, string> = {
  POS: "Local",
  WAITER: "Mesero",
  ONLINE: "Online",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  CASHIER: "Cajero",
  COOK: "Cocinero",
  WAITER: "Mesero",
};
