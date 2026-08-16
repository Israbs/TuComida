"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Beef, Pencil, Plus, Search, Trash2, Utensils } from "lucide-react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ProductFormDialog,
  type EditingProduct,
  type ProductFormPayload,
} from "./product-form-dialog";

export function ProductList() {
  const utils = api.useUtils();
  const { data: products, isLoading } = api.inventory.getProducts.useQuery();
  const { data: categories } = api.inventory.getCategories.useQuery();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditingProduct | null>(null);
  const [deleting, setDeleting] = useState<EditingProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useSocketEvent("inventory:changed", () => {
    utils.inventory.getProducts.invalidate();
    utils.inventory.getCategories.invalidate();
  });

  const createMutation = api.inventory.createProduct.useMutation({
    onSuccess: () => {
      utils.inventory.getProducts.invalidate();
      toast.success("Producto creado");
      setFormOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.inventory.updateProduct.useMutation({
    onSuccess: () => {
      utils.inventory.getProducts.invalidate();
      toast.success("Producto actualizado");
      setFormOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.inventory.deleteProduct.useMutation({
    onSuccess: () => {
      utils.inventory.getProducts.invalidate();
      utils.inventory.getCategories.invalidate();
      toast.success("Producto eliminado");
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleteLoading(false);
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      const matchTerm =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term) ?? false);
      const matchCategory =
        categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchTerm && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const handleSave = async (payload: ProductFormPayload) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const totalActive = useMemo(
    () => products?.filter((p) => p.isActive).length ?? 0,
    [products],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus /> Nuevo Producto
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            categoryFilter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          )}
        >
          Todas
          <span className="ml-1.5 text-xs opacity-70">{products?.length ?? 0}</span>
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              categoryFilter === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {c.name}
            <span className="ml-1.5 text-xs opacity-70">{c._count.products}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Beef className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No hay productos</p>
            <p className="text-sm text-muted-foreground">
              {search || categoryFilter !== "all"
                ? "Ningún producto coincide con tu búsqueda."
                : "Crea tu primer producto para empezar."}
            </p>
          </div>
          {!search && categoryFilter === "all" && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus /> Nuevo Producto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-2xl border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)] animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/40 to-background">
                    <Utensils className="size-10 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-background/85 text-foreground backdrop-blur">
                    {p.category.name}
                  </Badge>
                </div>
                {!p.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                    <Badge variant="secondary">Inactivo</Badge>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="space-y-1">
                  <h3 className="truncate font-semibold">{p.name}</h3>
                  {p.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {p.ingredients.length > 0 && (
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                      {p.ingredients.length} ingrediente{p.ingredients.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {p.addons.length > 0 && (
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                      {p.addons.length} adicional{p.addons.length !== 1 ? "es" : ""}
                    </Badge>
                  )}
                  {p.ingredients.length === 0 && p.addons.length === 0 && (
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                      Sin extras
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-lg font-bold">${(p.priceCents / 100).toFixed(2)}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Editar ${p.name}`}
                      className="cursor-pointer"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label={`Eliminar ${p.name}`}
                      className="cursor-pointer"
                      onClick={() => setDeleting(p)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalActive > 0 && (
        <p className="text-xs text-muted-foreground">
          {totalActive} producto{totalActive !== 1 ? "s" : ""} activo
          {totalActive !== 1 ? "s" : ""}
        </p>
      )}

      <ProductFormDialog
        key={formOpen ? (editing?.id ?? "new-product") : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => { if (!v) setDeleting(null); }}
        title="Eliminar producto"
        description={
          deleting
            ? `¿Seguro que querés eliminar "${deleting.name}"? Esta acción no se puede deshacer.`
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