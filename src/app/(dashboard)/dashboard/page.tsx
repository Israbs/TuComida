import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { roleHome } from "@/lib/access";
import type { OrderOrigin, OrderStatus } from "@/generated/prisma/enums";
import {
  addDays,
  dayKey,
  hoursBetween,
  meanMs,
  money,
  moneyShort,
  pctChange,
  ROLE_LABEL,
  spanishDateLong,
  startOfDay,
  sumAddonsPrice,
  weekdayShort,
} from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { Section } from "@/components/dashboard/section";
import { SalesChart, type DayPoint } from "@/components/dashboard/sales-chart";
import { DonutChart, type DonutSegment } from "@/components/dashboard/donut-chart";
import { TopProducts, type RankedItem } from "@/components/dashboard/top-products";
import { StatusStrip } from "@/components/dashboard/status-strip";
import { OrderTimes, type TimePhase } from "@/components/dashboard/order-times";
import { RecentOrders, type RecentOrder } from "@/components/dashboard/recent-orders";
import { TeamNow, type TeamMember } from "@/components/dashboard/team-now";
import { TablesOverview, type TablePill } from "@/components/dashboard/tables-overview";
import { OnlineLinkCard } from "@/components/dashboard/online-link-card";
import {
  ArrowUpRight,
  ChefHat,
  CircleDollarSign,
  Crown,
  Flame,
  Package,
  ReceiptText,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_LABEL: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  SCALE: "Scale",
};

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const ORIGIN_FLOW: { origin: OrderOrigin; label: string; color: string }[] = [
  { origin: "POS", label: "Local", color: "bg-primary" },
  { origin: "WAITER", label: "Meseros", color: "bg-sky-500" },
  { origin: "ONLINE", label: "Online", color: "bg-violet-500" },
];

type TimingOrder = {
  createdAt: Date;
  preparingAt: Date | null;
  readyAt: Date | null;
  paidAt: Date | null;
};

function phaseStats(list: TimingOrder[]) {
  const complete = list.filter((o) => o.preparingAt && o.readyAt && o.paidAt);
  const total = complete.map((o) => o.paidAt!.getTime() - o.createdAt.getTime());
  const wait = complete.map((o) => o.preparingAt!.getTime() - o.createdAt.getTime());
  const prep = complete.map(
    (o) => o.readyAt!.getTime() - o.preparingAt!.getTime(),
  );
  const service = complete.map(
    (o) => o.paidAt!.getTime() - o.readyAt!.getTime(),
  );
  return {
    totalMs: meanMs(total),
    waitMs: meanMs(wait),
    prepMs: meanMs(prep),
    serviceMs: meanMs(service),
    measured: complete.length,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect(roleHome[session.user.role]);

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = addDays(todayStart, -1);
  const chartStart = addDays(todayStart, -13);
  const weekStart = addDays(todayStart, -6);
  const prevWeekStart = addDays(weekStart, -7);

  const [
    paidOrders,
    timingOrders,
    todayOrders,
    yesterdayOrders,
    openOrdersCount,
    onlineOpenCount,
    tables,
    attendances,
    productCount,
    categoryCount,
    recentOrders,
    tenant,
    subscription,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId, paidAt: { gte: chartStart } },
      select: {
        totalCents: true,
        paidAt: true,
        origin: true,
        items: {
          select: {
            quantity: true,
            unitPriceCents: true,
            addons: true,
            product: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { tenantId, createdAt: { gte: chartStart } },
      select: { createdAt: true, preparingAt: true, readyAt: true, paidAt: true },
    }),
    prisma.order.findMany({
      where: { tenantId, createdAt: { gte: todayStart } },
      select: { status: true, origin: true, paidAt: true },
    }),
    prisma.order.count({
      where: { tenantId, createdAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.order.count({
      where: {
        tenantId,
        OR: [
          { status: { in: ["PENDING", "PREPARING", "READY"] } },
          { status: "DELIVERED", paidAt: null },
        ],
      },
    }),
    prisma.order.count({
      where: {
        tenantId,
        origin: "ONLINE",
        paidAt: null,
        status: { not: "CANCELLED" },
      },
    }),
    prisma.table.findMany({
      where: { tenantId, isActive: true },
      select: {
        number: true,
        orders: {
          where: { paidAt: null, status: { not: "CANCELLED" } },
          select: { totalCents: true },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { tenantId, clockIn: { gte: todayStart } },
      select: {
        userId: true,
        clockIn: true,
        clockOut: true,
        hourlyRate: true,
        user: {
          select: {
            name: true,
            role: true,
            employee: { select: { hourlyRateCents: true } },
          },
        },
      },
    }),
    prisma.product.count({ where: { tenantId, isActive: true } }),
    prisma.category.count({ where: { tenantId, isActive: true } }),
    prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        number: true,
        customerName: true,
        status: true,
        origin: true,
        totalCents: true,
        createdAt: true,
        table: { select: { number: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true },
    }),
    prisma.subscription.findUnique({ where: { tenantId }, select: { plan: true } }),
  ]);

  /* ─── Ventas (14 días para comparar semanas) ─── */
  const dayTotals = new Map<string, number>();
  for (const o of paidOrders) {
    if (!o.paidAt) continue;
    const key = dayKey(o.paidAt);
    dayTotals.set(key, (dayTotals.get(key) ?? 0) + o.totalCents);
  }

  const days: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(todayStart, -i);
    days.push({ label: weekdayShort(d), value: dayTotals.get(dayKey(d)) ?? 0 });
  }

  const todaySales = dayTotals.get(dayKey(now)) ?? 0;
  const yesterdaySales = dayTotals.get(dayKey(addDays(now, -1))) ?? 0;
  const salesTrend = pctChange(todaySales, yesterdaySales);

  /* ─── Pedidos en línea ─── */
  const onlineToday = todayOrders.filter((o) => o.origin === "ONLINE").length;
  const onlineRevenueCents = paidOrders
    .filter((o) => o.origin === "ONLINE" && o.paidAt && o.paidAt >= todayStart)
    .reduce((s, o) => s + o.totalCents, 0);
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl = host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const onlineUrl = `${baseUrl.replace(/\/+$/, "")}/c/${tenant?.slug}`;

  const weekSales = days.reduce((s, d) => s + d.value, 0);
  let prevWeekSales = 0;
  for (let i = 13; i >= 7; i--) {
    prevWeekSales += dayTotals.get(dayKey(addDays(todayStart, -i))) ?? 0;
  }
  const weekTrend = pctChange(weekSales, prevWeekSales);

  /* ─── Tiempos de pedido ─── */
  const todayStats = phaseStats(timingOrders.filter((o) => o.createdAt >= todayStart));
  const weekStats = phaseStats(timingOrders.filter((o) => o.createdAt >= weekStart));
  const prevWeekStats = phaseStats(
    timingOrders.filter((o) => o.createdAt >= prevWeekStart && o.createdAt < weekStart),
  );
  const disp = todayStats.measured > 0 ? todayStats : weekStats;
  const totalMs = disp.totalMs;
  const timeTrend =
    totalMs !== null && prevWeekStats.totalMs !== null
      ? pctChange(totalMs, prevWeekStats.totalMs)
      : null;
  const timePhases: TimePhase[] = [
    { key: "wait", label: "Espera de cocina", color: "bg-amber-400", ms: disp.waitMs },
    { key: "prep", label: "Preparación", color: "bg-orange-500", ms: disp.prepMs },
    { key: "service", label: "Servicio", color: "bg-sky-500", ms: disp.serviceMs },
  ].filter((p): p is TimePhase => p.ms !== null);
  const slowestPhase =
    timePhases.length > 0
      ? timePhases.reduce((a, b) => (b.ms > a.ms ? b : a), timePhases[0])
      : null;

  /* ─── Órdenes de hoy ─── */
  const ordersToday = todayOrders.length;
  const paidTodayCount = todayOrders.filter((o) => o.paidAt).length;
  const cancelledToday = todayOrders.filter((o) => o.status === "CANCELLED").length;
  const ticketAvg = paidTodayCount > 0 ? Math.round(todaySales / paidTodayCount) : 0;
  const ordersTrend = pctChange(ordersToday, yesterdayOrders);

  const statusCounts: Record<OrderStatus, number> = {
    PENDING: 0,
    PREPARING: 0,
    READY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  const originCounts: Record<OrderOrigin, number> = { POS: 0, WAITER: 0, ONLINE: 0 };
  for (const o of todayOrders) {
    statusCounts[o.status] += 1;
    originCounts[o.origin] += 1;
  }
  const originTotal = todayOrders.length;

  /* ─── Categorías y productos (7 días) ─── */
  const catMap = new Map<string, number>();
  const prodMap = new Map<string, { value: number; count: number }>();
  for (const o of paidOrders) {
    if (!o.paidAt || o.paidAt.getTime() < weekStart.getTime()) continue;
    for (const it of o.items) {
      const line = it.quantity * (it.unitPriceCents + sumAddonsPrice(it.addons));
      const cat = it.product.category?.name ?? "Sin categoría";
      catMap.set(cat, (catMap.get(cat) ?? 0) + line);
      const prev = prodMap.get(it.product.name) ?? { value: 0, count: 0 };
      prodMap.set(it.product.name, {
        value: prev.value + line,
        count: prev.count + it.quantity,
      });
    }
  }

  const sortedCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 5);
  const restCats = sortedCats.slice(5).reduce((s, [, v]) => s + v, 0);
  const donutSegments: DonutSegment[] = topCats.map(([name, value], i) => ({
    name,
    value,
    color: CATEGORY_COLORS[i] ?? CATEGORY_COLORS[5],
  }));
  if (restCats > 0) {
    donutSegments.push({ name: "Otros", value: restCats, color: CATEGORY_COLORS[5] });
  }
  const topCategoryName = donutSegments[0]?.name ?? "—";

  const topProducts: RankedItem[] = [...prodMap.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([name, { value, count }]) => ({ name, value, count }));
  const starProduct = topProducts[0];

  /* ─── Mesas ─── */
  const tablePills: TablePill[] = tables.map((t) => ({
    number: t.number,
    occupied: t.orders.length > 0,
  }));
  const occupiedCount = tablePills.filter((t) => t.occupied).length;
  const freeCount = tablePills.length - occupiedCount;
  const openRevenue = tables.reduce(
    (s, t) => s + t.orders.reduce((a, o) => a + o.totalCents, 0),
    0,
  );

  /* ─── Equipo ─── */
  const teamMembers: TeamMember[] = attendances.map((a) => ({
    name: a.user.name,
    roleLabel: ROLE_LABEL[a.user.role] ?? a.user.role,
    clockIn: a.clockIn,
    clockOut: a.clockOut,
    hourlyRate: a.user.employee?.hourlyRateCents ?? 0,
  }));
  const activeNow = teamMembers.filter((m) => !m.clockOut).length;
  const workedCount = new Set(attendances.map((a) => a.userId)).size;
  const laborCostCents = attendances.reduce((sum, a) => {
    if (!a.clockOut) return sum;
    return sum + Math.round(a.hourlyRate * 100 * hoursBetween(a.clockIn, a.clockOut));
  }, 0);

  /* ─── Últimas órdenes ─── */
  const recentOrdersData: RecentOrder[] = recentOrders.map((o) => ({
    number: o.number,
    customerName: o.customerName,
    status: o.status,
    origin: o.origin,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    itemCount: o._count.items,
    tableLabel: o.table ? o.table.name ?? `Mesa ${o.table.number}` : null,
  }));

  const firstName = session.user.name.trim().split(/\s+/)[0] || "colega";
  const plan = subscription?.plan ? (PLAN_LABEL[subscription.plan] ?? subscription.plan) : null;

  /* ─── Sparkline del hero ─── */
  const sparkMax = Math.max(...days.map((d) => d.value), 1);
  const spark = days
    .map(
      (d, i) =>
        `${(i / (days.length - 1)) * 100},${26 - (d.value / sparkMax) * 22}`,
    )
    .join(" ");

  return (
    <div className="space-y-6">
      {/* ─── Encabezado ─── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {spanishDateLong(now)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hola, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este es el pulso de <span className="font-medium text-foreground">{tenant?.name}</span>{" "}
            hoy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            En Vivo
          </span>
          {plan && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Store className="size-3.5 text-primary" />
              Plan {plan}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Semana {moneyShort(weekSales)}
          </span>
        </div>
      </div>

      {/* ─── Hero: ventas de hoy ─── */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-chart-2 to-chart-4 p-6 text-primary-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col justify-between gap-6 lg:col-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                Ventas de hoy
              </p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl">
                {money(todaySales)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {salesTrend === null ? (
                  <span className="text-primary-foreground/70">sin datos previos</span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-semibold",
                      salesTrend >= 0 ? "text-emerald-100" : "text-rose-200",
                    )}
                  >
                    <ArrowUpRight className={cn("size-4", salesTrend < 0 && "rotate-180")} />
                    {Math.abs(salesTrend).toLocaleString("es-AR", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                )}
                <span className="text-primary-foreground/70">vs ayer</span>
                {weekTrend !== null && (
                  <>
                    <span className="size-1 rounded-full bg-primary-foreground/40" />
                    <span className="text-primary-foreground/70">
                      semana {weekTrend >= 0 ? "+" : ""}
                      {weekTrend.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-primary-foreground/80">
                <span>Últimos 7 días</span>
                <span className="font-semibold text-primary-foreground">
                  {moneyShort(weekSales)}
                </span>
              </div>
              <svg viewBox="0 0 100 26" className="h-12 w-full" preserveAspectRatio="none">
                <polygon
                  points={`0,26 ${spark} 100,26`}
                  fill="white"
                  opacity="0.12"
                />
                <polyline
                  points={spark}
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.95"
                />
              </svg>
            </div>
          </div>

          <div className="grid content-start grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold tabular-nums">{paidTodayCount}</p>
              <p className="text-[11px] font-medium text-primary-foreground/80">cobradas</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold tabular-nums">{money(ticketAvg)}</p>
              <p className="text-[11px] font-medium text-primary-foreground/80">ticket promedio</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold tabular-nums">{cancelledToday}</p>
              <p className="text-[11px] font-medium text-primary-foreground/80">canceladas</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold tabular-nums">{openOrdersCount}</p>
              <p className="text-[11px] font-medium text-primary-foreground/80">en curso</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KPIs ─── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Órdenes de hoy"
          value={String(ordersToday)}
          icon={ReceiptText}
          trend={ordersTrend}
          trendLabel="vs ayer"
          sub={`${paidTodayCount} cobradas · ${cancelledToday} canceladas`}
        />
        <StatCard
          label="En curso"
          value={String(openOrdersCount)}
          icon={ChefHat}
          sub={`${occupiedCount} de ${tablePills.length} mesas ocupadas`}
        />
        <StatCard
          label="Costo laboral hoy"
          value={money(laborCostCents)}
          icon={Users}
          sub={`${activeNow} en el local ahora · ${workedCount} marcaron hoy`}
        />
        <StatCard
          label="Productos activos"
          value={String(productCount)}
          icon={Package}
          sub={`en ${categoryCount} categorías`}
        />
      </div>

      {/* ─── Pedidos en línea ─── */}
      <OnlineLinkCard
        url={onlineUrl}
        onlineToday={onlineToday}
        onlineOpen={onlineOpenCount}
        onlineRevenueCents={onlineRevenueCents}
      />

      {/* ─── Chart + Donut ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Ventas · últimos 7 días"
          subtitle={`Total de la semana ${money(weekSales)}`}
          className="lg:col-span-2"
          action={
            weekTrend !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                  weekTrend >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                )}
              >
                <ArrowUpRight className={cn("size-3.5", weekTrend < 0 && "rotate-180")} />
                {Math.abs(weekTrend).toLocaleString("es-AR", {
                  maximumFractionDigits: 1,
                })}
                %
                <span className="font-normal text-muted-foreground">vs semana anterior</span>
              </span>
            ) : undefined
          }
        >
          <SalesChart points={days} />
        </Section>

        <Section
          title="Ventas por categoría"
          subtitle={`últimos 7 días · ${topCategoryName}`}
        >
          {donutSegments.length > 0 ? (
            <DonutChart
              segments={donutSegments}
              centerValue={money(weekSales)}
              centerLabel="semana"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Sin ventas esta semana.</p>
          )}
        </Section>
      </div>

      {/* ─── Tiempos + Estados ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Tiempos de pedido"
          subtitle="¿cuánto tarda todo el proceso?"
          className="lg:col-span-2"
          action={
            slowestPhase && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Flame className="size-3.5" />
                {slowestPhase.label}
              </span>
            )
          }
        >
          <OrderTimes
            totalMs={totalMs}
            phases={timePhases}
            measured={disp.measured}
            trend={timeTrend}
          />
        </Section>

        <Section title="Estados de hoy" subtitle="distribución de las órdenes del día">
          <StatusStrip counts={statusCounts} total={ordersToday} />
        </Section>
      </div>

      {/* ─── Top productos + Mesas + Equipo ─── */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Section
          title="Top productos"
          subtitle="por facturación · 7 días"
          action={
            starProduct && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Crown className="size-3.5" />
                {starProduct.name}
              </span>
            )
          }
        >
          {topProducts.length > 0 ? (
            <TopProducts items={topProducts} total={weekSales} />
          ) : (
            <p className="text-sm text-muted-foreground">Sin ventas esta semana.</p>
          )}
        </Section>

        <Section title="Mesas" subtitle="ocupación actual">
          <TablesOverview
            tables={tablePills}
            occupiedCount={occupiedCount}
            freeCount={freeCount}
            openRevenue={openRevenue}
          />
        </Section>

        <Section title="Equipo ahora" subtitle="marcaciones del día">
          <TeamNow
            members={teamMembers}
            totalCost={laborCostCents}
            activeCount={activeNow}
            workedCount={workedCount}
          />
        </Section>
      </div>

      {/* ─── Últimas órdenes + Orígenes ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Últimas órdenes"
          subtitle="actividad reciente del local"
          className="lg:col-span-2"
        >
          <RecentOrders orders={recentOrdersData} />
        </Section>

        <Section title="Orígenes de hoy" subtitle="por dónde llegan los pedidos">
          {originTotal > 0 ? (
            <ul className="space-y-4">
              {ORIGIN_FLOW.map((o) => {
                const count = originCounts[o.origin];
                const pct = (count / originTotal) * 100;
                return (
                  <li key={o.origin}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-full", o.color)} />
                        <span className="font-medium">{o.label}</span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        {count}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {pct.toLocaleString("es-AR", { maximumFractionDigits: 0 })}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", o.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin órdenes hoy todavía.</p>
          )}
        </Section>
      </div>

      {/* ─── Insight ─── */}
      {(starProduct || slowestPhase) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <span className="flex items-center gap-2">
            <CircleDollarSign className="size-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{starProduct?.name}</span> es tu
              producto estrella de la semana.
            </span>
          </span>
          {slowestPhase && (
            <span className="flex items-center gap-2">
              <Flame className="size-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">
                La <span className="font-semibold text-foreground">{slowestPhase.label}</span> es la
                fase más lenta del pedido:{" "}
                {openOrdersCount > 0
                  ? `ahora mismo hay ${openOrdersCount} órdenes en curso.`
                  : "agilizarla reduce el tiempo total de cada mesa."}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}