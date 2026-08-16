import type { inventoryRouter } from "@/trpc/routers/inventory";
import type { inferRouterOutputs } from "@trpc/server";

type InventoryRouter = inferRouterOutputs<typeof inventoryRouter>;
export type Product = InventoryRouter["getProducts"][number];

export type CartItem = {
  key: string;
  product: Product;
  quantity: number;
  selectedAddonIds: string[];
  removedIngredients: string[];
  notes: string;
};

export function lineUnitPrice(item: CartItem): number {
  const addonsTotal = item.product.addons
    .filter((a) => item.selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.priceCents, 0);
  return item.product.priceCents + addonsTotal;
}

export function lineTotal(item: CartItem): number {
  return lineUnitPrice(item) * item.quantity;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}