import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccess, roleHome } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { SessionExtender } from "@/components/session-extender";

const allSections = [
  { href: "/mi-jornada", label: "Mi Jornada" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/attendance", label: "Asistencias" },
  { href: "/pos", label: "POS" },
  { href: "/kds", label: "Cocina" },
  { href: "/inventory", label: "Inventario" },
  { href: "/hr", label: "Personal" },
  { href: "/tables", label: "Mesas" },
  { href: "/catalog", label: "Catálogo" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const tenantId = session.user.tenantId

  const navItems = allSections.filter((item) => canAccess(role, item.href));

  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true },
      })
    : null;

  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl = host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const catalogUrl = tenant
    ? `${baseUrl.replace(/\/+$/, "")}/c/${tenant.slug}`
    : undefined;

  return (
    <DashboardShell
      navItems={navItems}
      user={{ name: session.user.name, email: session.user.email }}
      homeHref={roleHome[role]}
      catalogUrl={catalogUrl}
    >
      {children}
      <SessionExtender />
    </DashboardShell>
  );
}