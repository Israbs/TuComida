"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Smartphone } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

export function OnlineLinkCard({
  url,
  onlineToday,
  onlineOpen,
  onlineRevenueCents,
}: {
  url: string;
  onlineToday: number;
  onlineOpen: number;
  onlineRevenueCents: number;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyToClipboard(url);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Pedidos en línea</h2>
              <p className="text-xs text-muted-foreground">tu carta online está viva</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="truncate rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground sm:text-sm">
              {url}
            </span>
            <button
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
              aria-label="Copiar enlace"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ExternalLink className="size-4" />
              Abrir
            </Link>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-3 md:w-auto">
          <div className="min-w-20 rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold tabular-nums">{onlineToday}</p>
            <p className="text-[11px] font-medium text-muted-foreground">hoy</p>
          </div>
          <div className="min-w-20 rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold tabular-nums">{onlineOpen}</p>
            <p className="text-[11px] font-medium text-muted-foreground">en curso</p>
          </div>
          <div className="min-w-20 rounded-xl bg-muted/50 p-3 text-center">
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                onlineRevenueCents > 0 ? "text-emerald-600 dark:text-emerald-400" : "",
              )}
            >
              {`$${(onlineRevenueCents / 100).toLocaleString("es-AR", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}`}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">facturado hoy</p>
          </div>
        </div>
      </div>
    </section>
  );
}