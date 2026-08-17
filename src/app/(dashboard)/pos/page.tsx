"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search, Utensils } from "lucide-react";
import { cn, uuid } from "@/lib/utils";
import { api } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { CartPanel } from "./cart";
import { OpenOrdersPanel } from "./open-orders";
import { RecentPaidPanel } from "./recent-paid";
import { formatPrice, type CartItem, type Product } from "./types";

type Tab = "order" | "open" | "paid";

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const customizable = product.addons.length > 0 || product.ingredients.length > 0;
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/40 to-background">
            <Utensils className="size-8 text-primary/40" />
          </div>
        )}
        {customizable && (
          <span className="absolute top-2 left-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
            Personalizable
          </span>
        )}
      </div>
      <div className="flex-1 space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
        <p className="text-base font-bold text-primary">
          {formatPrice(product.priceCents)}
        </p>
      </div>
    </button>
  );
}

export default function POSPage() {
  const utils = api.useUtils();

  const { data: products, isLoading } = api.inventory.getProducts.useQuery();
  const { data: categories } = api.inventory.getCategories.useQuery();
  const { data: tables } = api.orders.getTables.useQuery();
  const { data: activeOrders } = api.orders.getActiveOrders.useQuery();
  const { data: recentPaid } = api.orders.getRecentPaid.useQuery();

  const invalidateOrders = () => {
    utils.orders.getActiveOrders.invalidate();
    utils.orders.getRecentPaid.invalidate();
  };

  useSocketEvent("orders:changed", () => invalidateOrders());

  const [tab, setTab] = useState<Tab>("order");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const createMutation = api.orders.createOrder.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success("Pedido enviado a cocina");
      setItems([]);
      setTableId("");
      setCustomerName("");
      setOrderNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  const payMutation = api.orders.payOrder.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success("Pedido cobrado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deliverMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success("Pedido entregado");
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success("Pedido cancelado");
    },
    onError: (err) => toast.error(err.message),
  });

  const actionBusy =
    payMutation.isPending ||
    deliverMutation.isPending ||
    cancelMutation.isPending ||
    createMutation.isPending;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      const matchTerm = !term || p.name.toLowerCase().includes(term);
      const matchCategory =
        categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchTerm && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const addToCart = (product: Product) => {
    setItems((prev) => [
      ...prev,
      {
        key: uuid(),
        product,
        quantity: 1,
        selectedAddonIds: [],
        removedIngredients: [],
        notes: "",
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<CartItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const handleSubmit = async (payNow: boolean) => {
    if (items.length === 0) return;
    setCreating(true);
    try {
      await createMutation.mutateAsync({
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        notes: orderNotes || undefined,
        payNow,
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          addons: it.selectedAddonIds.map((id) => ({ id })),
          removedIngredients: it.removedIngredients,
          notes: it.notes || undefined,
        })),
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-2xl border bg-background lg:h-[calc(100dvh-6.5rem)]">
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        {/* Productos */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-9"
              />
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
                  categoryFilter === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                Todos
              </button>
              {(categories ?? []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
                    categoryFilter === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                <Utensils className="size-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Ningún producto coincide con tu búsqueda."
                    : "Aún no hay productos activos."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <aside className="flex min-h-0 flex-col border-t bg-card lg:w-[400px] lg:shrink-0 lg:border-t-0 lg:border-l">
          <div className="inline-flex items-center gap-1 border-b bg-muted/30 p-1.5">
            {(
              [
                { id: "order", label: "Pedido" },
                { id: "open", label: "En curso" },
                { id: "paid", label: "Cobrados" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "order" ? (  
            <CartPanel
              items={items}
              tables={(tables ?? []).map((t) => ({
                id: t.id,
                number: t.number,
                name: t.name,
              }))}
              tableId={tableId}
              customerName={customerName}
              orderNotes={orderNotes}
              submitting={creating}
              onTableChange={setTableId}
              onCustomerChange={setCustomerName}
              onNotesChange={setOrderNotes}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onClear={() => setItems([])}
              onSubmit={(payNow) => void handleSubmit(payNow)}
            />
          ) : tab === "open" ? (
            <OpenOrdersPanel
              orders={activeOrders ?? []}
              busy={actionBusy}
              onPay={(id) => payMutation.mutate({ id })}
              onDeliver={(id) => deliverMutation.mutate({ id, status: "DELIVERED" })}
              onCancel={(id) => cancelMutation.mutate({ id, status: "CANCELLED" })}
            />
          ) : (
            <RecentPaidPanel orders={recentPaid ?? []} />
          )}
        </aside>
      </div>
    </div>
  );
}