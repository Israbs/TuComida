"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Search, 
  Plus, 
  Trash2, 
  Move, 
  Check, 
  X, 
  Utensils, 
  ListPlus, 
  Pencil,
  ArrowLeft
} from "lucide-react";
import { cn, uuid } from "@/lib/utils";
import { api } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/use-socket-event";

import { CartPanel } from "../pos/cart";
import { OpenOrdersPanel } from "../pos/open-orders";
import { formatPrice, type CartItem, type Product } from "../pos/types";

type FilterStatus = "all" | "free" | "occupied";
type Tab = "order" | "open";

interface TableItem {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  posX: number;
  posY: number;
  status: "FREE" | "OCCUPIED";
  currentTotal?: string;
  activeOrderIds?: string[];
}

export default function TablesPage() {
  const utils = api.useUtils();

  const { data: rawTables, isLoading: isLoadingTables } = api.orders.getTables.useQuery();

  const createTableMutation = api.orders.createTable.useMutation({
    onSuccess: () => {
      utils.orders.getTables.invalidate();
      toast.success("Mesa creada correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePositionsMutation = api.orders.updateTablePositions.useMutation({
    onSuccess: () => {
      utils.orders.getTables.invalidate();
      setIsEditMode(false);
      toast.success("Plano actualizado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTableMutation = api.orders.deleteTable.useMutation({
    onSuccess: (_, variables) => {
      utils.orders.getTables.invalidate();
      setLocalPositions((prev) => {
        const updated = { ...prev };
        delete updated[variables.id];
        return updated;
      });
      toast.success("Mesa eliminada");
    },
    onError: (err) => toast.error(err.message),
  });


  const { data: productsData, isLoading: isLoadingProducts } = api.inventory.getProducts.useQuery();
  const products = (productsData as Product[]) ?? [];

  const { data: categories } = api.inventory.getCategories.useQuery();
  const { data: activeOrders } = api.orders.getActiveOrders.useQuery();
  const { data: recentPaid } = api.orders.getRecentPaid.useQuery();

  const invalidateOrders = () => {
    utils.orders.getActiveOrders.invalidate();
    utils.orders.getRecentPaid.invalidate();
    utils.orders.getTables.invalidate();
  };

  useSocketEvent("tables:changed", () => utils.orders.getTables.invalidate());
  useSocketEvent("orders:changed", () => invalidateOrders());

  const createMutation = api.orders.createOrder.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success("Pedido enviado a cocina");
      setItems([]);
      setCustomerName("");
      setOrderNotes("");
      setTab("open");
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
      toast.success("Pedido actualizado");
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

  // ───── Estados ─────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [tab, setTab] = useState<Tab>("order");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [isEditMode, setIsEditMode] = useState(false);
  const [localPositions, setLocalPositions] = useState<Record<string, { posX: number; posY: number }>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingTableId = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ───── Estados carrito ─────
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const calculateGridPosition = (index: number) => {
    const columns = 4;
    return {
      posX: 30 + (index % columns) * 130,
      posY: 40 + Math.floor(index / columns) * 130,
    };
  };

  useEffect(() => {
    if (rawTables) {
      const coords: Record<string, { posX: number; posY: number }> = {};
      rawTables.forEach((t, index) => {
        if (t.posX === 0 && t.posY === 0) {
          coords[t.id] = calculateGridPosition(index);
        } else {
          coords[t.id] = { posX: t.posX, posY: t.posY };
        }
      });
      setLocalPositions(coords);
    }
  }, [rawTables]);

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rawTables ?? []).filter((t) => {
      const matchSearch = !term || t.number.toString().includes(term) || (t.name && t.name.toLowerCase().includes(term));
      const matchStatus = statusFilter === "all" || (statusFilter === "free" && t.status === "FREE") || (statusFilter === "occupied" && t.status === "OCCUPIED");
      return matchSearch && matchStatus;
    });
  }, [rawTables, search, statusFilter]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchTerm = !term || p.name.toLowerCase().includes(term);
      const matchCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchTerm && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const tableActiveOrders = useMemo(() => {
    if (!selectedTable || !activeOrders) return [];
    return activeOrders.filter((o) => o.tableId === selectedTable.id || o.table?.number === selectedTable.number);
  }, [activeOrders, selectedTable]);

  // ───── Logica arrastre ─────
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode || !canvasRef.current) return;
    draggingTableId.current = tableId;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentPos = localPositions[tableId] || { posX: 0, posY: 0 };
    dragOffset.current = {
      x: e.clientX - canvasRect.left - currentPos.posX,
      y: e.clientY - canvasRect.top - currentPos.posY,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingTableId.current || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    let newX = Math.round(e.clientX - canvasRect.left - dragOffset.current.x);
    let newY = Math.round(e.clientY - canvasRect.top - dragOffset.current.y);
    newX = Math.max(10, Math.min(newX, canvasRect.width - 120));
    newY = Math.max(10, Math.min(newY, canvasRect.height - 120));
    setLocalPositions((prev) => ({
      ...prev,
      [draggingTableId.current!]: { posX: newX, posY: newY },
    }));
  };

  const handleMouseUp = () => {
    draggingTableId.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  // ───── Operaciones carrito ─────
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

  const updateCartItem = (key: string, patch: Partial<CartItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeCartItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const handleSubmitOrder = async (payNow: boolean) => {
    if (!selectedTable || items.length === 0) return;
    await createMutation.mutateAsync({
      tableId: selectedTable.id,
      customerName: customerName.trim() || undefined,
      notes: orderNotes.trim() || undefined,
      payNow,
      items: items.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
        addons: it.selectedAddonIds.map((id) => ({ id })),
        removedIngredients: it.removedIngredients,
        notes: it.notes || undefined,
      })),
    });
  };

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-2xl border bg-background lg:h-[calc(100dvh-6.5rem)]">
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        
        {/* Area principal */}
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedTable && !isEditMode ? (
            <div className="flex h-full flex-col bg-muted/10">

              {/* Header de la Mesa Seleccionada */}
              <div className="flex items-center gap-4 border-b bg-card px-4 py-3 shadow-sm">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setSelectedTable(null);
                    setItems([]);
                  }} 
                  className="shrink-0 hover:bg-muted"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Mesa {selectedTable.number}</h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedTable.status === "FREE" ? "Mesa Libre" : "Mesa Ocupada"} • Capacidad: {selectedTable.capacity} personas
                  </p>
                </div>
              </div>

              {/* Filtro de Categorias */}
              <div className="border-b bg-card p-3 overflow-x-auto">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      categoryFilter === "all"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
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
                        "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                        categoryFilter === c.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catalogo */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 pb-12">
                    {filteredProducts.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => addToCart(prod)}
                        className="group flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          {(prod.addons.length > 0 || prod.ingredients.length > 0) && (
                            <span className="absolute left-2 top-2 z-10 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
                              Personalizable
                            </span>
                          )}
                          {prod.image ? (
                            <Image
                              src={prod.image}
                              alt={prod.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted/40 to-background">
                              <Utensils className="size-8 text-primary/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-3">
                          <span className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary">
                            {prod.name}
                          </span>
                          <span className="mt-2 text-sm font-extrabold text-primary">
                            {formatPrice(prod.priceCents)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
    
            /* LIENZO */
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar mesa..."
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: "all", label: "Todos" },
                      { id: "free", label: "Libres" },
                      { id: "occupied", label: "Ocupadas" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setStatusFilter(f.id as FilterStatus)}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          statusFilter === f.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <>
                      <Button 
                      size="sm" 
                      className="gap-1.5" 
                      onClick={() => {
                        const nextNumber = (rawTables?.length ?? 0) + 1;
                        createTableMutation.mutate({ number: nextNumber });
                      }}
                      disabled={createTableMutation.isPending}
                      >
                        <Plus className="size-4" /> Nueva Mesa
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsEditMode(true)}>
                        <Pencil className="size-4" /> Editar Plano
                      </Button>
                    </>
                    
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setIsEditMode(false)}
                      >
                        <X className="size-4" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          const payload = Object.entries(localPositions).map(([id, pos]) => ({ id, posX: pos.posX, posY: pos.posY }));
                          updatePositionsMutation.mutate(payload);
                        }}
                        disabled={updatePositionsMutation.isPending}
                      >
                        <Check className="size-4" /> Guardar Plano
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas interactivo */}
              <div ref={canvasRef} className="relative min-h-[500px] flex-1 overflow-auto bg-[#2d1b18] bg-[url('/fondo-madera.jpg')] bg-cover bg-center p-6 shadow-inner select-none">
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                
                {isLoadingTables ? (
                  <div className="relative z-10 grid grid-cols-3 gap-6 p-8 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/10" />
                    ))}
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center text-white/80">
                    <Utensils className="size-10 mb-2 opacity-60" />
                    <p className="text-sm font-medium">No hay mesas disponibles.</p>
                  </div>
                ) : (
                  filteredTables.map((table) => {
                    const pos = localPositions[table.id] || { posX: 30, posY: 40 };
                    const isSelected = selectedTable?.id === table.id;
                    const tableOrders = activeOrders?.filter((o) => o.tableId === table.id || o.table?.number === table.number) ?? [];
                    
                    // Verificamos si tiene ordenes activas y si todas fueron entregadas
                    const hasActiveOrders = tableOrders.length > 0;
                    const allDelivered = hasActiveOrders && tableOrders.every((o) => o.status === "DELIVERED");
                    
                    const isOccupied = table.status === "OCCUPIED" && tableOrders.length > 0;
                    
                    // Obtenemos el nombre del primer cliente asociado (si existe)
                    const customerName = tableOrders.find((o) => o.customerName)?.customerName;

                    return (
                      <div
                        key={table.id}
                        onMouseDown={(e) => handleMouseDown(e, table.id)}
                        onClick={() => !isEditMode && setSelectedTable(table as TableItem)}
                        style={{ position: "absolute", left: `${pos.posX}px`, top: `${pos.posY}px` }}
                        className={cn(
                          "group relative flex aspect-square w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-1.5 shadow-md transition-all",
                          isOccupied 
                            ? "bg-rose-950/40 border-rose-500/70 text-rose-200" 
                            : "bg-emerald-950/40 border-emerald-500/70 text-emerald-200",
                          isSelected && "ring-4 ring-amber-400 ring-offset-2 ring-offset-black",
                          isEditMode && "cursor-grab active:cursor-grabbing border-dashed border-amber-400 z-30"
                        )}
                      >
                        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                          <Image src="/mesa.jpg" alt={`Mesa ${table.number}`} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform" />
                          <div className={cn("absolute inset-0", isOccupied ? "bg-rose-950/40" : "bg-emerald-950/40")} />
                        </div>
                        <div className="relative z-10 flex size-7 items-center justify-center rounded-lg bg-white/90 text-zinc-800 shadow-sm backdrop-blur pointer-events-none">
                          {isEditMode ? <Move className="size-4" /> : <ListPlus className="size-4" />}
                        </div>
                        
                        {/* Indicador de numero, capacidad y nombre del cliente */}
                        <div className="absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur border border-white/10 pointer-events-none flex flex-col items-center">
                          <span>Mesa {table.number} | {table.capacity}p</span>
                          {customerName && (
                            <span className="text-[9px] text-amber-400 truncate max-w-[100px]">
                              {customerName}
                            </span>
                          )}
                        </div>

                        {isEditMode && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar mesa?")) deleteTableMutation.mutate({ id: table.id }); }}
                            className="absolute -top-2 -right-2 z-40 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow hover:scale-110 transition-transform"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <aside className="flex min-h-0 flex-col border-t bg-card lg:w-[420px] lg:shrink-0 lg:border-t-0 lg:border-l">
          {!selectedTable ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Utensils className="size-8 opacity-60" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Selecciona una Mesa</h3>
              <p className="text-sm">Toca una mesa en el plano para asociar el pedido directamente y comenzar a cargar productos.</p>
            </div>
          ) : (
            <>
              {/* Tabs de Seleccion */}
              <div className="inline-flex items-center gap-1 border-b bg-muted/30 p-1.5">
                {(
                  [
                    { id: "order", label: "Pedido" },
                    { id: "open", label: "En curso" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                      tab === t.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                    {t.id === "open" && tableActiveOrders.length > 0 && (
                      <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {tableActiveOrders.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Render de Paneles Importados */}
              {tab === "order" ? (
                <CartPanel
                  items={items}
                  tables={(rawTables ?? []).map((t) => ({
                    id: t.id,
                    number: t.number,
                    name: t.name,
                  }))}
                  tableId={selectedTable.id}
                  customerName={customerName}
                  orderNotes={orderNotes}
                  submitting={createMutation.isPending}
                  onTableChange={(id) => {
                    const newTable = rawTables?.find((t) => t.id === id);
                    if (newTable) setSelectedTable(newTable as TableItem);
                  }}
                  onCustomerChange={setCustomerName}
                  onNotesChange={setOrderNotes}
                  onUpdateItem={updateCartItem}
                  onRemoveItem={removeCartItem}
                  onClear={() => setItems([])}
                  onSubmit={(payNow) => void handleSubmitOrder(payNow)}
                  hideTableSelect = {true}
                />
              ) : (
                <OpenOrdersPanel
                  orders={tableActiveOrders}
                  recent={recentPaid ?? []}
                  busy={actionBusy}
                  onPay={(id) => payMutation.mutate({ id })}
                  onDeliver={(id) => deliverMutation.mutate({ id, status: "DELIVERED" })}
                  onCancel={(id) => cancelMutation.mutate({ id, status: "CANCELLED" })}
                />
              )}
            </>
          )}
        </aside>

      </div>
    </div>
  );
}