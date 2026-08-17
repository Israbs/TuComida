import type { Metadata } from "next";
import { OrderTracker } from "../../order-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seguí tu pedido",
  description: "Estado de tu pedido en tiempo real.",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <OrderTracker slug={slug} id={id} />;
}