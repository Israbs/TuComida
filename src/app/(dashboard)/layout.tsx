import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pos", label: "POS" },
    { href: "/kds", label: "Cocina" },
    { href: "/inventory", label: "Inventario" },
    { href: "/hr", label: "Personal" },
    { href: "/tables", label: "Mesas" },
  ];

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold">
            TuComida
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <p className="text-sm text-muted-foreground">
            {session.user.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {session.user.email}
          </p>
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <h2 className="text-lg font-semibold">Bienvenido, {session.user.name}</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
