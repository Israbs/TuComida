"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bike,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  LocateFixed,
  Minus,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Utensils,
} from "lucide-react";
import { cn, uuid } from "@/lib/utils";
import { api } from "@/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  cartCount,
  cartTotal,
  formatPrice,
  lineTotal,
  lineUnitPrice,
  type CartLine,
  type DeliveryType,
  type OnlineCategory,
  type OnlineProduct,
} from "./types";

function ProductImage({
  product,
  className,
}: {
  product: OnlineProduct;
  className?: string;
}) {
  if (!product.image) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/40 to-background">
        <Utensils className="size-9 text-primary/40" />
      </div>
    );
  }
  return (
    <Image
      src={product.image}
      alt={product.name}
      fill
      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
      className={cn("object-cover", className)}
    />
  );
}

function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border p-1">
      <button
        type="button"
        aria-label="Quitar uno"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Agregar uno"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function OrderApp({
  slug,
  tenantName,
  categories,
}: {
  slug: string;
  tenantName: string;
  categories: OnlineCategory[];
}) {
  const router = useRouter();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("PICKUP");
  const [address, setAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [cashInput, setCashInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState<{ product: OnlineProduct; lineKey: string | null } | null>(
    null,
  );
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [lineNotes, setLineNotes] = useState("");

  const createMutation = api.orders.createOnlineOrder.useMutation();

  const total = cartTotal(cart);
  const count = cartCount(cart);

  const cashCents = Math.round(parseFloat(cashInput.replace(",", ".")) * 100);
  const changeCents =
    Number.isFinite(cashCents) && cashCents > total ? cashCents - total : 0;
  const hasChange = changeCents > 0;

  const useMyLocation = () => {
    if (locating) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapsLink(
          `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        );
        setLocating(false);
        toast.success("Ubicación actual cargada en el link de Maps");
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Para usarlo, permití el acceso a tu ubicación o pegá el link de Maps"
            : "No pudimos obtener tu ubicación. Pegá el link de Google Maps manualmente",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const filtered = categories
    .map((c) => {
      const term = search.trim().toLowerCase();
      const products = term
        ? c.products.filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              p.description?.toLowerCase().includes(term),
          )
        : c.products;
      return { ...c, products };
    })
    .filter((c) => c.products.length > 0);

  const openNew = (product: OnlineProduct) => {
    setDialog({ product, lineKey: null });
    setQty(1);
    setSelectedAddons([]);
    setRemovedIngredients([]);
    setLineNotes("");
  };

  const openEdit = (line: CartLine) => {
    setDialog({ product: line.product, lineKey: line.key });
    setQty(line.quantity);
    setSelectedAddons([...line.selectedAddonIds]);
    setRemovedIngredients([...line.removedIngredients]);
    setLineNotes(line.notes);
  };

  const confirmDialog = () => {
    if (!dialog) return;
    const line: CartLine = {
      key: dialog.lineKey ?? uuid(),
      product: dialog.product,
      quantity: qty,
      selectedAddonIds: selectedAddons,
      removedIngredients,
      notes: lineNotes,
    };
    setCart((prev) =>
      dialog.lineKey
        ? prev.map((l) => (l.key === dialog.lineKey ? line : l))
        : [...prev, line],
    );
    setDialog(null);
  };

  const updateLine = (key: string, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  };

  const dialogUnit = dialog ? lineUnitPrice({
    key: "",
    product: dialog.product,
    quantity: 1,
    selectedAddonIds: selectedAddons,
    removedIngredients,
    notes: "",
  }) : 0;

  const submit = async () => {
    const name = customerName.trim();
    if (!name) {
      toast.error("Contanos tu nombre para el pedido");
      return;
    }
    if (deliveryType === "DELIVERY" && !address.trim()) {
      toast.error("Necesitamos la dirección de entrega");
      return;
    }
    if (cart.length === 0) return;
    try {
      const order = await createMutation.mutateAsync({
        slug,
        customerName: name,
        notes: orderNotes.trim() || undefined,
        deliveryType,
        ...(deliveryType === "DELIVERY"
          ? {
              address: address.trim(),
              mapsLink: mapsLink.trim() || undefined,
              cashGivenCents:
                Number.isFinite(cashCents) && cashCents > 0 ? cashCents : undefined,
            }
          : {}),
        items: cart.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          addons: l.selectedAddonIds.map((id) => ({ id })),
          removedIngredients: l.removedIngredients,
          notes: l.notes || undefined,
        })),
      });
      toast.success(`Pedido #${order.number} enviado a la cocina`);
      router.push(`/c/${slug}/orden/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el pedido");
    }
  };

  const dialogProduct = dialog?.product;

  return (
    <div className="min-h-screen bg-[#faf5ee]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-[#0d0b09] text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-extrabold tracking-tight">{tenantName}</span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            Pedidos en línea
          </span>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Menú digital
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {tenantName}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Armá tu pedido, sumalo al carrito y lo preparamos apenas lo confirmes.
          </p>
          <div className="relative mx-auto mt-5 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en el menú..."
              className="h-11 rounded-full border-none bg-white pl-10 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
              aria-label="Buscar en el menú"
            />
          </div>
        </div>
      </div>

      {/* ─── Catálogo ─── */}
      {filtered.length > 0 ? (
        <>
          {!search && (
            <div className="sticky top-14 z-30 border-b bg-[#faf5ee]/90 backdrop-blur">
              <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
                {categories.map((c) => (
                  <a
                    key={c.id}
                    href={`#cat-${c.id}`}
                    className="shrink-0 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {c.name}
                    <span className="ml-1.5 text-xs opacity-60">{c.products.length}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <main className="mx-auto max-w-6xl space-y-14 px-4 py-12 pb-32">
            {filtered.map((c) => (
              <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-1.5 rounded-full bg-primary" />
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">{c.name}</h2>
                    {c.description && (
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {c.products.map((p) => (
                    <article
                      key={p.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)]"
                    >
                      <button
                        type="button"
                        onClick={() => openNew(p)}
                        className="relative block aspect-[4/3] overflow-hidden bg-muted text-left"
                        aria-label={`Agregar ${p.name}`}
                      >
                        <ProductImage product={p} className="transition-transform duration-300 group-hover:scale-105" />
                        {(p.addons.length > 0 || p.ingredients.length > 0) && (
                          <span className="absolute top-2 left-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
                            Personalizable
                          </span>
                        )}
                      </button>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="font-semibold leading-tight">{p.name}</h3>
                        {p.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {p.description}
                          </p>
                        )}
                        {p.ingredients.length > 0 && (
                          <p className="text-xs text-muted-foreground/80">
                            {p.ingredients.join(" · ")}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(p.priceCents)}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openNew(p)}
                            className="rounded-full font-semibold"
                          >
                            <Plus className="size-4" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </>
      ) : (
        <main className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Utensils className="size-7" />
          </div>
          <p className="font-medium">
            {search ? "No encontramos nada con ese nombre" : "Todavía no hay productos en la carta"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Probá con otra palabra o limpiá la búsqueda."
              : "Pronto vas a poder hacer tu pedido online. ¡Volve en unos días!"}
          </p>
        </main>
      )}

      {/* ─── Barra flotante de carrito ─── */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-4 z-40 px-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-[#0d0b09] px-5 py-3.5 text-white shadow-[0_14px_34px_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.02]"
          >
            <span className="flex items-center gap-2">
              <span className="relative">
                <ShoppingBag className="size-5" />
                <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold">
                  {count}
                </span>
              </span>
              <span className="text-sm font-semibold">Ver pedido</span>
            </span>
            <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
              {formatPrice(total)}
              <ChevronRight className="size-4" />
            </span>
          </button>
        </div>
      )}

      {/* ─── Dialog: personalizar producto ─── */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          {dialogProduct && (
            <>
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                <ProductImage product={dialogProduct} />
              </div>
              <DialogHeader>
                <DialogTitle>{dialogProduct.name}</DialogTitle>
                <DialogDescription className="text-sm">
                  {dialogProduct.description}
                </DialogDescription>
              </DialogHeader>

              {dialogProduct.addons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Agregados</p>
                  {dialogProduct.addons.map((a) => {
                    const active = selectedAddons.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setSelectedAddons((prev) =>
                            active ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-md border",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
                            )}
                          >
                            {active && <Check className="size-3.5" />}
                          </span>
                          {a.name}
                        </span>
                        {a.priceCents > 0 ? (
                          <span className="font-semibold tabular-nums">
                            +{formatPrice(a.priceCents)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">incluido</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {dialogProduct.ingredients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Quitar ingredientes</p>
                  <div className="flex flex-wrap gap-2">
                    {dialogProduct.ingredients.map((ing) => {
                      const active = removedIngredients.includes(ing);
                      return (
                        <button
                          key={ing}
                          type="button"
                          onClick={() =>
                            setRemovedIngredients((prev) =>
                              active ? prev.filter((x) => x !== ing) : [...prev, ing],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "border-rose-300 bg-rose-500/10 text-rose-600 line-through dark:text-rose-400"
                              : "border-border bg-background text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="line-notes" className="text-sm font-semibold">
                  Nota para la cocina
                </label>
                <Textarea
                  id="line-notes"
                  value={lineNotes}
                  onChange={(e) => setLineNotes(e.target.value)}
                  placeholder="Ej: sin sal, bien cocido..."
                  maxLength={200}
                />
              </div>

              <DialogFooter className="flex-row items-center justify-between gap-3 sm:justify-between">
                <QuantityStepper value={qty} onChange={setQty} />
                <Button
                  type="button"
                  onClick={confirmDialog}
                  className="rounded-full font-semibold"
                >
                  {dialog.lineKey ? "Guardar cambios" : "Agregar al pedido"}
                  <span className="ml-1.5 font-bold tabular-nums">
                    · {formatPrice(dialogUnit * qty)}
                  </span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Sheet: carrito + checkout ─── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Tu pedido</SheetTitle>
            <SheetDescription className="text-xs">
              {count} {count === 1 ? "producto" : "productos"} · {formatPrice(total)}
            </SheetDescription>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ShoppingBag className="size-6" />
              </div>
              <p className="font-medium">El carrito está vacío</p>
              <p className="text-sm text-muted-foreground">
                El menú te está esperando ahí arriba.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 rounded-full"
                onClick={() => setCartOpen(false)}
              >
                Ver el menú
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {cart.map((line) => {
                  const addonNames = line.product.addons
                    .filter((a) => line.selectedAddonIds.includes(a.id))
                    .map((a) => a.name);
                  return (
                    <div key={line.key} className="flex gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <ProductImage product={line.product} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">
                            {line.product.name}
                          </p>
                          <button
                            type="button"
                            aria-label="Quitar del pedido"
                            onClick={() => removeLine(line.key)}
                            className="text-muted-foreground transition-colors hover:text-rose-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        {addonNames.length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            + {addonNames.join(", ")}
                          </p>
                        )}
                        {line.removedIngredients.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            sin {line.removedIngredients.join(", ")}
                          </p>
                        )}
                        {line.notes && (
                          <p className="truncate text-xs italic text-muted-foreground">
                            “{line.notes}”
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <QuantityStepper
                              value={line.quantity}
                              min={1}
                              onChange={(v) => updateLine(line.key, { quantity: v })}
                            />
                            <button
                              type="button"
                              aria-label="Personalizar"
                              onClick={() => openEdit(line)}
                              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-bold tabular-nums">
                            {formatPrice(lineTotal(line))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t px-5 py-4">
                <div className="space-y-1.5">
                  <label htmlFor="customer-name" className="text-sm font-semibold">
                    Tu nombre
                  </label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Para avisarte cuando esté listo"
                    maxLength={80}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">¿Cómo lo recibís?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("PICKUP")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        deliveryType === "PICKUP"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      <Store className="size-4" />
                      Retirar en el local
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("DELIVERY")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        deliveryType === "DELIVERY"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      <Bike className="size-4" />
                      Delivery
                    </button>
                  </div>
                </div>

                {deliveryType === "DELIVERY" && (
                  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Datos de entrega
                    </p>
                    <div className="space-y-1.5">
                      <label htmlFor="delivery-address" className="text-sm font-semibold">
                        Dirección de entrega
                      </label>
                      <Input
                        id="delivery-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej: Av. Principal, casa 24..."
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="delivery-maps" className="text-sm font-semibold">
                        Link de Google Maps
                      </label>
                      <Input
                        id="delivery-maps"
                        value={mapsLink}
                        onChange={(e) => setMapsLink(e.target.value)}
                        placeholder="Pegá el link 'Compartir' de tu ubicación"
                        maxLength={500}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={useMyLocation}
                          disabled={locating}
                          className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                        >
                          {locating ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <LocateFixed className="size-3.5" />
                          )}
                          {locating ? "Buscando..." : "Usar mi ubicación"}
                        </button>
                        <a
                          href="https://www.google.com/maps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <ExternalLink className="size-3.5" />
                          Abrir Google Maps
                        </a>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        En Google Maps tocá <span className="font-medium">Compartir</span> y copiá
                        el enlace, o usá tu ubicación actual.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="delivery-cash" className="text-sm font-semibold">
                        ¿Con cuánto pagás? (efectivo)
                      </label>
                      <Input
                        id="delivery-cash"
                        value={cashInput}
                        onChange={(e) => setCashInput(e.target.value)}
                        placeholder={`Ej: ${formatPrice(total)}`}
                        inputMode="decimal"
                      />
                      <p className="text-xs text-muted-foreground">
                        {hasChange ? (
                          <>
                            Vuelto a llevar:{" "}
                            <span className="font-bold text-primary">
                              {formatPrice(changeCents)}
                            </span>
                          </>
                        ) : (
                          "Pago exacto · el motorizado no lleva vuelto"
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="order-notes" className="text-sm font-semibold">
                    Notas del pedido
                  </label>
                  <Textarea
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={
                      deliveryType === "DELIVERY"
                        ? "Ej: tocar el timbre, piso 2..."
                        : "Ej: lo retiro en 30 minutos..."
                    }
                    maxLength={300}
                    className="max-h-24"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-extrabold tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={submit}
                  disabled={createMutation.isPending}
                  className="w-full rounded-full font-semibold"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Confirmar pedido"
                  )}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  {deliveryType === "DELIVERY"
                    ? "Pagás en efectivo al recibir · Podés seguir el pedido en tiempo real"
                    : "Pagás al retirar en el local · Podés seguir el pedido en tiempo real"}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-[#0d0b09]">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 px-4 py-6 text-xs text-white/50">
          Pedidos online con
          <Link href="/" className="font-bold text-white/70 hover:text-white">
            TuComida
          </Link>
        </p>
      </footer>
    </div>
  );
}