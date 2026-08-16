import { auth } from "@/lib/auth";
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
  const navItems = allSections.filter((item) => canAccess(role, item.href));

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });

  return (
    <DashboardShell
      navItems={navItems}
      user={{ name: session.user.name, email: session.user.email }}
      homeHref={roleHome[role]}
      catalogHref={tenant ? `/c/${tenant.slug}` : undefined}
    >
      {children}
      <SessionExtender />
    </DashboardShell>
  );
}