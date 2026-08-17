import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { roleHome } from "@/lib/access";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect(roleHome[session.user.role]);
  
  const tenantId = session.user.tenantId;

  if (!tenantId) {
    redirect("/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [productCount, tableCount, ordersToday, salesToday, openOrders] =
    await Promise.all([
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.table.count({ where: { tenantId, isActive: true } }),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: todayStart } },
      }),
      prisma.order.aggregate({
        where: { tenantId, paidAt: { gte: todayStart } },
        _sum: { totalCents: true },
      }),
      prisma.order.count({
        where: {
          tenantId,
          status: { in: ["PENDING", "PREPARING", "READY"] },
        },
      }),
    ]);

  const salesCents = salesToday._sum.totalCents ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Ventas Hoy</h3>
          <p className="mt-2 text-3xl font-bold">${(salesCents / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Órdenes Hoy</h3>
          <p className="mt-2 text-3xl font-bold">{ordersToday}</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Órdenes Abiertas</h3>
          <p className="mt-2 text-3xl font-bold">{openOrders}</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Productos</h3>
          <p className="mt-2 text-3xl font-bold">{productCount}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Mesas activas: {tableCount}
      </p>
    </div>
  );
}
