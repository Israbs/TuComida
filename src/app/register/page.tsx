import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { roleHome } from "@/lib/access";
import { RegisterForm } from "@/components/register-form";
import { SUBSCRIPTION } from "@/lib/subscription";
import { Check } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  restaurant: "Escribí el nombre de tu restaurante.",
  name: "Escribí tu nombre.",
  email: "Ingresá un email válido.",
  password: "La contraseña debe tener al menos 6 caracteres.",
  taken: "Ese email ya está registrado. Iniciá sesión en su lugar.",
  login: "Se creó tu cuenta, pero no pudimos iniciar sesión. Entrá desde el login.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect(roleHome[session.user.role]);

  const params = await searchParams;
  const error = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 to-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          TuComida
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Ya tengo cuenta
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Creá tu restaurante
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Contanos sobre tu negocio y en un minuto estás adentro con todo
            habilitado.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="h-fit overflow-hidden rounded-2xl border bg-card lg:sticky lg:top-8">
            <div className="border-b bg-muted/40 px-6 py-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Tu suscripción
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-extrabold">
                  ${SUBSCRIPTION.price}
                  <span className="text-base font-medium text-muted-foreground">/mes</span>
                </span>
              </div>
              <p className="mt-1 text-sm font-medium">{SUBSCRIPTION.name}</p>
              <p className="text-sm text-muted-foreground">{SUBSCRIPTION.tagline}</p>
            </div>
            <ul className="space-y-2.5 px-6 py-5">
              {SUBSCRIPTION.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <RegisterForm />
          </section>
        </div>
      </main>
    </div>
  );
}