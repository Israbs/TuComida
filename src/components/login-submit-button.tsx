"use client";

import { useFormStatus } from "react-dom";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? "Iniciando sesión..." : "Iniciar Sesión"}
    </button>
  );
}