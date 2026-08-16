import type { SubscriptionPlan } from "@/generated/prisma/enums";

export const SUBSCRIPTION = {
  name: "Todo incluido",
  tagline: "Una sola suscripción. Todos los módulos habilitados.",
  price: 49,
  features: [
    "Dashboard de ventas en tiempo real",
    "Punto de venta (POS)",
    "Pantalla de cocina (KDS)",
    "Inventario y carta digital",
    "RRHH: perfiles, turnos e invitaciones",
    "Asistencias con código rotatorio",
    "Mesas y QR",
    "Usuarios ilimitados",
  ],
} as const;

export const SUBSCRIPTION_PLAN: SubscriptionPlan = "SCALE";
export const SUBSCRIPTION_BILLING_CYCLE = "monthly";
export const SUBSCRIPTION_PERIOD_DAYS = 30;