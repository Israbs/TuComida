import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleHome } from "@/lib/access";
import { loginAction } from "./actions";
import { LoginSubmitButton } from "@/components/login-submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect(roleHome[session.user.role]);

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">TuComida</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión en tu cuenta
          </p>
        </div>

        <form action={loginAction} className="space-y-4">
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">Credenciales inválidas</p>
          )}

          <LoginSubmitButton />
        </form>

        <p className="text-center text-sm text-muted-foreground">
          El registro de nuevos establecimientos estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}