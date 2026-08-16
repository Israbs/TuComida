"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  CategoryFormDialog,
  type CategoryFormPayload,
} from "./category-form-dialog";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: { products: number };
};

export function CategoryList() {
  const utils = api.useUtils();
  const { data: categories, isLoading } = api.inventory.getCategories.useQuery();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useSocketEvent("inventory:changed", () => {
    utils.inventory.getCategories.invalidate();
  });

  const createMutation = api.inventory.createCategory.useMutation({
    onSuccess: () => {
      utils.inventory.getCategories.invalidate();
      toast.success("Categoría creada");
      setFormOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.inventory.updateCategory.useMutation({
    onSuccess: () => {
      utils.inventory.getCategories.invalidate();
      toast.success("Categoría actualizada");
      setFormOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.inventory.deleteCategory.useMutation({
    onSuccess: () => {
      utils.inventory.getCategories.invalidate();
      toast.success("Categoría eliminada");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleteLoading(false);
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (categories ?? []).filter(
      (c) =>
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.description?.toLowerCase().includes(term) ?? false),
    );
  }, [categories, search]);

  const handleSave = async (payload: CategoryFormPayload) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus /> Nueva Categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Tag className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No hay categorías</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Ninguna categoría coincide con tu búsqueda."
                : "Crea categorías para ordenar tu menú."}
            </p>
          </div>
          {!search && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus /> Nueva Categoría
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)] animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Tag className="size-5" />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Editar ${c.name}`}
                    className="cursor-pointer"
                    onClick={() => { setEditing(c); setFormOpen(true); }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`Eliminar ${c.name}`}
                    className="cursor-pointer"
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{c.name}</h3>
                {c.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                ) : null}
              </div>
              <div className="mt-auto flex items-center gap-2 border-t pt-3">
                <Badge variant="secondary">
                  {c._count.products}{" "}
                  {c._count.products === 1 ? "producto" : "productos"}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  Orden {c.sortOrder}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormDialog
        key={formOpen ? (editing?.id ?? "new-category") : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => { if (!v) setDeleting(null); }}
        title="Eliminar categoría"
        description={
          deleting
            ? `¿Seguro que querés eliminar "${deleting.name}"? Solo se pueden eliminar categorías sin productos.`
            : ""
        }
        loading={deleteLoading}
        onConfirm={() => {
          if (!deleting) return;
          setDeleteLoading(true);
          deleteMutation.mutate({ id: deleting.id });
        }}
      />
    </div>
  );
}