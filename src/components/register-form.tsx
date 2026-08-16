"use client";

import { useFormStatus } from "react-dom";
import { registerAction } from "@/app/register/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
    >
      {pending ? "Procesando pago simulado..." : "Crear mi cuenta y activar todo"}
    </button>
  );
}

export function RegisterForm() {
  return (
    <form action={registerAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="restaurant" className="text-sm font-medium">
          Nombre de tu restaurante
        </label>
        <input
          id="restaurant"
          name="restaurant"
          type="text"
          required
          autoComplete="organization"
          placeholder="P. ej. La Esquina"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Tu nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="P. ej. Martín"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repetí la contraseña"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Una suscripción te habilita todos los módulos. El pago es una
        <strong> simulación</strong>: en producción se integra una pasarela real.
      </p>

      <SubmitButton />
    </form>
  );
}