"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "./image-upload";

export type ProductFormPayload = {
  name: string;
  description?: string;
  priceCents: number;
  categoryId: string;
  image?: string;
  isActive: boolean;
  ingredients: { name: string }[];
  addons: { name: string; priceCents: number }[];
};

export type EditingProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string;
  image: string | null;
  isActive: boolean;
  ingredients: { name: string }[];
  addons: { name: string; priceCents: number }[];
};

type CategoryOption = { id: string; name: string };

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: EditingProduct | null;
  categories: CategoryOption[];
  onSave: (payload: ProductFormPayload) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product ? String((product.priceCents / 100).toFixed(2)) : "",
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? "",
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<string[]>(
    product?.ingredients.map((i) => i.name) ?? [],
  );
  const [ingredientInput, setIngredientInput] = useState("");
  const [addons, setAddons] = useState<{ name: string; price: string }[]>(
    product
      ? product.addons.map((a) => ({
          name: a.name,
          price: (a.priceCents / 100).toFixed(2),
        }))
      : [],
  );
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      setPendingImage(file);
      return;
    }
    setPendingImage(null);
    setImage(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) return null;
    return (json.url as string) ?? null;
  };

  const addIngredient = () => {
    const value = ingredientInput.trim();
    if (value && !ingredients.includes(value)) {
      setIngredients((prev) => [...prev, value]);
    }
    setIngredientInput("");
  };

  const removeAddon = (idx: number) => {
    setAddons((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAddon = () => {
    const value = addonName.trim();
    const parsed = parseFloat(addonPrice);
    if (value && !isNaN(parsed) && parsed >= 0) {
      setAddons((prev) => [...prev, { name: value, price: addonPrice }]);
      setAddonName("");
      setAddonPrice("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!price || isNaN(priceCents) || priceCents <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (!categoryId) {
      setError("Selecciona una categoría");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let finalImage = image;
      let uploadedUrl: string | null = null;
      if (pendingImage) {
        finalImage = await uploadImage(pendingImage);
        if (!finalImage) throw new Error("No se pudo subir la imagen");
        uploadedUrl = finalImage;
      }
      try {
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          priceCents,
          categoryId,
          image: finalImage ?? undefined,
          isActive,
          ingredients: ingredients.map((n) => ({ name: n })),
          addons: addons.map((a) => ({
            name: a.name.trim(),
            priceCents: Math.round(parseFloat(a.price) * 100) || 0,
          })),
        });
      } catch (err) {
        if (uploadedUrl) {
          fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: uploadedUrl }),
          }).catch(() => {});
        }
        throw err;
      }
    } catch {
      setError("No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,46rem)] max-h-[min(92dvh,46rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          <DialogDescription>
            Ingredientes que el cliente puede quitar y adicionales con precio propio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label>Imagen</Label>
              <ImageUpload
                value={image}
                pending={pendingImage}
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pf-name">Nombre</Label>
                <Input
                  id="pf-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hamburguesa Clásica"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-desc">Descripción</Label>
                <Textarea
                  id="pf-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del plato"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pf-price">Precio</Label>
                  <Input
                    id="pf-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-category">Categoría</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(v) => {
                      if (v) setCategoryId(v);
                    }}
                  >
                    <SelectTrigger id="pf-category">
                      <SelectValue placeholder="Seleccionar categoría">
                        {(value) =>
                          categories.find((c) => c.id === value)?.name ??
                          "Seleccionar categoría"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Producto activo
              </label>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Ingredientes</Label>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, i) => (
                <Badge key={`${ing}-${i}`} variant="secondary" className="gap-1 pr-1 py-1">
                  {ing}
                  <button
                    type="button"
                    aria-label={`Quitar ${ing}`}
                    onClick={() => removeIngredient(i)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {ingredients.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ingredientes que el cliente podrá sacar del plato.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
                placeholder="Ej: cebolla, tomate, queso..."
              />
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus /> Agregar
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Adicionales</Label>
            <div className="space-y-2">
              {addons.map((a, i) => (
                <div
                  key={`${a.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2"
                >
                  <span className="text-sm">{a.name}</span>
                  <span className="ml-auto text-sm font-medium">
                    ${parseFloat(a.price).toFixed(2)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Quitar ${a.name}`}
                    onClick={() => removeAddon(i)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
              {addons.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Adicionales con precio, ej: extra queso +$1.00.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAddon();
                  }
                }}
                placeholder="Nombre del adicional"
                className="flex-1"
              />
              <Input
                value={addonPrice}
                onChange={(e) => setAddonPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="$0.00"
                className="w-28"
              />
              <Button type="button" variant="outline" size="sm" onClick={addAddon}>
                <Plus /> Agregar
              </Button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3.5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : product ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}