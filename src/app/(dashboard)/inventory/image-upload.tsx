"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImageUpload({
  value,
  pending,
  onChange,
  aspect = "aspect-[4/3]",
  alt = "Imagen",
}: {
  value: string | null;
  pending: File | null;
  onChange: (file: File | null) => void;
  aspect?: string;
  alt?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (pending ? URL.createObjectURL(pending) : null),
    [pending],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const src = previewUrl ?? value;
  const hasImage = !!src;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className={`relative w-full overflow-hidden rounded-xl border bg-muted/40 ${aspect}`}>
        {hasImage ? (
          <Image
            src={src as string}
            alt={alt}
            fill
            unoptimized
            sizes="240px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-6" />
              <span>Sin imagen</span>
            </div>
          </div>
        )}
        {pending && (
          <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            Pendiente de guardar
          </span>
        )}
        {hasImage && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Quitar imagen"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-background/80 backdrop-blur hover:bg-background"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        {hasImage ? "Cambiar imagen" : "Subir imagen"}
      </Button>
    </div>
  );
}