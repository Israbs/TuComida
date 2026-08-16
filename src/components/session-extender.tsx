"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const WARNING_MS = 10 * 60 * 1000;

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function SessionExtender() {
  const { data: session, status, update } = useSession();
  const [now, setNow] = useState(() => Date.now());
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expires = session?.expires
    ? new Date(session.expires).getTime()
    : null;
  const remaining = expires ? expires - now : null;

  if (status !== "authenticated" || !expires || !remaining) return null;
  if (remaining > WARNING_MS) return null;

  const expired = remaining <= 0;

  const handleExtend = async () => {
    try {
      setExtending(true);
      await update();
      toast.success("Sesión extendida");
    } catch {
      toast.error("No se pudo extender la sesión");
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-lg dark:bg-yellow-950">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
          {expired ? "Sesión expirada" : "Tu sesión está por vencer"}
        </p>
      </div>
      <p className="text-sm text-yellow-800 dark:text-yellow-200">
        {expired
          ? "Tu sesión terminó. Volvé a iniciar sesión para seguir trabajando."
          : `Expira en ${fmt(remaining)}. Extendela para no perder la sesión mientras trabajás.`}
      </p>
      <div className="flex gap-2">
        {expired ? (
          <Button size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Iniciar sesión de nuevo
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={handleExtend} disabled={extending}>
              {extending ? "Extendiendo..." : "Extender sesión"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Salir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}