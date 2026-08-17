"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export function SidebarShare({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyToClipboard(url);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-sidebar-border p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Menú online
      </p>
      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-1.5">
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir menú público"
            className="min-w-0 flex-1 truncate font-mono text-[11px] text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
          >
            {url}
          </Link>
          <button
            type="button"
            onClick={copy}
            aria-label="Copiar enlace del menú"
            className="shrink-0 rounded-md p-1 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ExternalLink className="size-3.5" />
          Abrir menú
        </Link>
      </div>
    </div>
  );
}