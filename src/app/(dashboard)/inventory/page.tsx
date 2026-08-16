"use client";

import { useState } from "react";
import { Beef, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductList } from "./product-list";
import { CategoryList } from "./category-list";

type Tab = "products" | "categories";

const tabs: { id: Tab; label: string; icon: typeof Beef }[] = [
  { id: "products", label: "Productos", icon: Beef },
  { id: "categories", label: "Categorías", icon: Tag },
];

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná tu menú: productos, ingredientes y adicionales.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border bg-muted/40 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "products" ? <ProductList /> : <CategoryList />}
    </div>
  );
}