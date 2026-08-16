"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { roleHome } from "@/lib/access";
import type { UserRole } from "@/generated/prisma/enums";

function InviteContent() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data, isLoading, error: queryError } = api.hr.getInviteUser.useQuery(
    { token },
    { enabled: token.length > 0 },
  );

  const accept = api.hr.acceptInvitation.useMutation({
    onError: (err) => {
      setLoading(false);
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await accept.mutateAsync({ token, password });
      const res = await signIn("credentials", {
        email: data?.email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Tu cuenta se creó. Iniciá sesión con tu correo y contraseña.");
        setLoading(false);
        return;
      }
      toast.success("Contraseña creada. ¡Bienvenido!");
      const session = await fetch("/api/auth/session").then((r) => r.json());
      const role = session?.user?.role as UserRole | undefined;
      router.push(role ? roleHome[role] : "/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold">TuComida</h1>
          {data ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">{data.name}</strong>, te invitó{" "}
              <strong className="text-foreground">{data.restaurant}</strong>. Creá tu contraseña
              para empezar.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Creá tu contraseña para empezar a trabajar.
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : queryError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {queryError.message}
          </div>
        ) : data ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-p1">Nueva contraseña</Label>
              <Input
                id="inv-p1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-p2">Confirmar contraseña</Label>
              <Input
                id="inv-p2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creando cuenta..." : "Aceptar invitación"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteContent />
    </Suspense>
  );
}