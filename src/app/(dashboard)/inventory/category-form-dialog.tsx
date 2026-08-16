"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type CategoryFormPayload = {
  name: string;
  description?: string;
  sortOrder: number;
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { id: string; name: string; description: string | null; sortOrder: number } | null;
  onSave: (payload: CategoryFormPayload) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder: parseInt(sortOrder) || 0,
      });
    } catch {
      setError("No se pudo guardar la categoría");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          <DialogDescription>
            Agrúpa tus productos para encontrarlos rápido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cf-name">Nombre</Label>
            <Input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Hamburguesas, Postres, Cafés..."
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-desc">Descripción</Label>
            <Textarea
              id="cf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-order">Orden</Label>
            <Input
              id="cf-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              type="number"
              min={0}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : category ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}