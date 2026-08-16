"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCatalogUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard no disponible; ignorar
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
    >
      {copied ? (
        <Check className="size-4 text-emerald-500" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}