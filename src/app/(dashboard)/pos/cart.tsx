"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ChefHat,
  ChevronDown,
  Minus,
  Plus,
  ShoppingCart,
  Utensils,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cartTotal,
  formatPrice,
  lineTotal,
  lineUnitPrice,
  type CartItem,
} from "./types";

type TableInfo = { id: string; number: number; name: string | null };

function PersonalizePanel({
  item,
  onUpdate,
}: {
  item: CartItem;
  onUpdate: (key: string, patch: Partial<CartItem>) => void;
}) {
  const { product } = item;
  const hasAddons = product.addons.length > 0;
  const hasIngredients = product.ingredients.length > 0;

  if (!hasAddons && !hasIngredients) {
    return (
      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        Este producto no tiene extras ni ingredientes para personalizar.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg bg-muted/40 p-3">
      {hasAddons && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Adicionales
          </p>
          <div className="space-y-1.5">
            {product.addons.map((addon) => {
              const selected = item.selectedAddonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() =>
                    onUpdate(item.key, {
                      selectedAddonIds: selected
                        ? item.selectedAddonIds.filter((id) => id !== addon.id)
                        : [...item.selectedAddonIds, addon.id],
                    })
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span>{addon.name}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    +{formatPrice(addon.priceCents)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasIngredients && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ingredientes (tocá para quitar)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {product.ingredients.map((ing) => {
              const removed = item.removedIngredients.includes(ing.name);
              return (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() =>
                    onUpdate(item.key, {
                      removedIngredients: removed
                        ? item.removedIngredients.filter((n) => n !== ing.name)
                        : [...item.removedIngredients, ing.name],
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    removed
                      ? "border-destructive/40 bg-destructive/10 text-destructive line-through"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {removed ? `Sin ${ing.name}` : ing.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CartPanel({
  items,
  tables,
  tableId,
  customerName,
  orderNotes,
  submitting,
  onTableChange,
  onCustomerChange,
  onNotesChange,
  onUpdateItem,
  onRemoveItem,
  onClear,
  onSubmit,
  hideTableSelect = false,
}: {
  items: CartItem[];
  tables: TableInfo[];
  tableId: string;
  customerName: string;
  orderNotes: string;
  submitting: boolean;
  onTableChange: (v: string) => void;
  onCustomerChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onUpdateItem: (key: string, patch: Partial<CartItem>) => void;
  onRemoveItem: (key: string) => void;
  onClear: () => void;
  onSubmit: (payNow: boolean) => void;
  hideTableSelect?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-primary" />
          <h2 className="font-semibold">Pedido</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length} ítem{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Vaciar
          </button>
        )}
      </div>

      {!hideTableSelect ? (
        <div className="grid gap-2 border-b bg-muted/30 p-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Mesa
            </label>
            <select
              value={tableId}
              onChange={(e) => onTableChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Para llevar</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number}
                  {t.name ? ` · ${t.name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Cliente
            </label>
            <Input
              value={customerName}
              onChange={(e) => onCustomerChange(e.target.value)}
              placeholder="Nombre (opcional)"
              className="h-9"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-2 border-b bg-muted/30 p-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Cliente
            </label>
            <Input
              value={customerName}
              onChange={(e) => onCustomerChange(e.target.value)}
              placeholder="Nombre (opcional)"
              className="h-9"
            />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Utensils className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Tocá un producto para agregarlo al pedido.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const unitPrice = lineUnitPrice(item);
            const isExpanded = expanded === item.key;
            return (
              <div
                key={item.key}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Utensils className="size-5 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(unitPrice)}
                      {item.selectedAddonIds.length > 0 && (
                        <span className="ml-1 text-primary">
                          (+{item.selectedAddonIds.length} extra
                          {item.selectedAddonIds.length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </p>
                    {(item.product.addons.length > 0 ||
                      item.product.ingredients.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : item.key)}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        Personalizar
                        <ChevronDown
                          className={cn(
                            "size-3 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Restar cantidad"
                      onClick={() =>
                        onUpdateItem(item.key, { quantity: Math.max(1, item.quantity - 1) })
                      }
                      className="flex size-7 items-center justify-center rounded-md border hover:bg-muted"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Sumar cantidad"
                      onClick={() =>
                        onUpdateItem(item.key, { quantity: item.quantity + 1 })
                      }
                      className="flex size-7 items-center justify-center rounded-md border hover:bg-muted"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={`Quitar ${item.product.name}`}
                    onClick={() => onRemoveItem(item.key)}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t p-3">
                    <PersonalizePanel
                      item={item}
                      onUpdate={(key, patch) => onUpdateItem(key, patch)}
                    />
                    <Input
                      value={item.notes}
                      onChange={(e) =>
                        onUpdateItem(item.key, { notes: e.target.value })
                      }
                      placeholder="Nota para la cocina (ej: sin sal)"
                      className="mt-3 h-9 text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(lineTotal(item))}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t bg-card p-4">
        <Input
          value={orderNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notas del pedido (opcional)"
          className="mb-3 h-9"
        />
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-2xl font-extrabold tracking-tight">
            {formatPrice(cartTotal(items))}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            disabled={items.length === 0 || submitting}
            onClick={() => onSubmit(false)}
            className="h-11"
          >
            <ChefHat className="size-4" />
            Enviar a cocina
          </Button>
          <Button
            disabled={items.length === 0 || submitting}
            onClick={() => onSubmit(true)}
            className="h-11"
          >
            {submitting ? "Creando..." : "Cobrar y enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}