export type DeliveryType = "PICKUP" | "DELIVERY";

export type OnlineAddon = { id: string; name: string; priceCents: number };

export type OnlineProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  image: string | null;
  ingredients: string[];
  addons: OnlineAddon[];
};

export type OnlineCategory = {
  id: string;
  name: string;
  description: string | null;
  products: OnlineProduct[];
};

export type CartLine = {
  key: string;
  product: OnlineProduct;
  quantity: number;
  selectedAddonIds: string[];
  removedIngredients: string[];
  notes: string;
};

export function lineUnitPrice(line: CartLine): number {
  const addons = line.product.addons
    .filter((a) => line.selectedAddonIds.includes(a.id))
    .reduce((s, a) => s + a.priceCents, 0);
  return line.product.priceCents + addons;
}

export function lineTotal(line: CartLine): number {
  return lineUnitPrice(line) * line.quantity;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
