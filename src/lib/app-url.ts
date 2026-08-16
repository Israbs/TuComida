import { headers } from "next/headers";

export async function appBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export function catalogUrl(base: string, slug: string): string {
  return `${base.replace(/\/+$/, "")}/c/${slug}`;
}