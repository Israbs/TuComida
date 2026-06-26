"use client";

import { useState, FormEvent } from "react";
import { api } from "@/trpc/client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "products" | "categories";

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <Button
            variant={tab === "products" ? "default" : "outline"}
            onClick={() => setTab("products")}
          >
            Productos
          </Button>
          <Button
            variant={tab === "categories" ? "default" : "outline"}
            onClick={() => setTab("categories")}
          >
            Categorías
          </Button>
        </div>
      </div>

      {tab === "products" ? <ProductList /> : <CategoryList />}
    </div>
  );
}

function ProductList() {
  const utils = api.useUtils();
  const { data: products, isLoading } = api.inventory.getProducts.useQuery();
  const { data: categories } = api.inventory.getCategories.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");

  const createMutation = api.inventory.createProduct.useMutation({
    onSuccess: () => {
      utils.inventory.getProducts.invalidate();
      toast.success("Producto creado");
      resetForm();
    },
  });

  const updateMutation = api.inventory.updateProduct.useMutation({
    onSuccess: () => {
      utils.inventory.getProducts.invalidate();
      toast.success("Producto actualizado");
      resetForm();
    },
  });

  const deleteMutation = api.inventory.deleteProduct.useMutation({
    onSuccess: () => {
      utils.inventory.getProducts.invalidate();
      toast.success("Producto eliminado");
    },
  });

  const resetForm = () => {
    setOpen(false);
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategory("");
  };

  const openEdit = (id: string) => {
    const p = products?.find((x) => x.id === id);
    if (!p) return;
    setEditing(id);
    setFormName(p.name);
    setFormDesc(p.description ?? "");
    setFormPrice(String(p.price));
    setFormCategory(p.categoryId);
    setOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = {
      name: formName,
      description: formDesc || undefined,
      price: parseFloat(formPrice),
      categoryId: formCategory,
      isActive: true,
    };

    if (editing) {
      updateMutation.mutate({ id: editing, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger className={cn(buttonVariants(), "cursor-pointer")}>
            Nuevo Producto
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prod-name" className="text-sm font-medium">Nombre</label>
                <Input id="prod-name" name="name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="prod-desc" className="text-sm font-medium">Descripción</label>
                <Textarea id="prod-desc" name="description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="prod-price" className="text-sm font-medium">Precio</label>
                <Input id="prod-price" name="price" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="prod-category" className="text-sm font-medium">Categoría</label>
                <Select value={formCategory} onValueChange={(v) => { if (v) setFormCategory(v); }}>
                  <SelectTrigger id="prod-category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editing ? "Guardar Cambios" : "Crear Producto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.category.name}</TableCell>
              <TableCell>${p.price.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={p.isActive ? "default" : "secondary"}>
                  {p.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p.id)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: p.id })}>
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {products?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay productos aún
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CategoryList() {
  const utils = api.useUtils();
  const { data: categories, isLoading } = api.inventory.getCategories.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOrder, setFormOrder] = useState("0");

  const createMutation = api.inventory.createCategory.useMutation({
    onSuccess: () => {
      utils.inventory.getCategories.invalidate();
      toast.success("Categoría creada");
      resetForm();
    },
  });

  const updateMutation = api.inventory.updateCategory.useMutation({
    onSuccess: () => {
      utils.inventory.getCategories.invalidate();
      toast.success("Categoría actualizada");
      resetForm();
    },
  });

  const deleteMutation = api.inventory.deleteCategory.useMutation({
    onSuccess: () => {
      utils.inventory.getCategories.invalidate();
      toast.success("Categoría eliminada");
    },
  });

  const resetForm = () => {
    setOpen(false);
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setFormOrder("0");
  };

  const openEdit = (id: string) => {
    const c = categories?.find((x) => x.id === id);
    if (!c) return;
    setEditing(id);
    setFormName(c.name);
    setFormDesc(c.description ?? "");
    setFormOrder(String(c.sortOrder));
    setOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = {
      name: formName,
      description: formDesc || undefined,
      sortOrder: parseInt(formOrder) || 0,
    };

    if (editing) {
      updateMutation.mutate({ id: editing, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger className={cn(buttonVariants(), "cursor-pointer")}>
            Nueva Categoría
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="cat-name" className="text-sm font-medium">Nombre</label>
                <Input id="cat-name" name="name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="cat-desc" className="text-sm font-medium">Descripción</label>
                <Textarea id="cat-desc" name="description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="cat-order" className="text-sm font-medium">Orden</label>
                <Input id="cat-order" name="sortOrder" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} type="number" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editing ? "Guardar Cambios" : "Crear Categoría"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Orden</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.description ?? "-"}</TableCell>
              <TableCell>{c.sortOrder}</TableCell>
              <TableCell>{c._count.products}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(c.id)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: c.id })}>
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {categories?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay categorías aún
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
