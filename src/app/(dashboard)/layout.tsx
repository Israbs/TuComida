import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { MobileMenu } from "@/components/mobile-menu";

import { 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed, 
  Boxes, 
  Users, 
  Grid,
} from "lucide-react"

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
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
    { href: "/kds", label: "Cocina", icon: UtensilsCrossed },
    { href: "/inventory", label: "Inventario", icon: Boxes },
    { href: "/hr", label: "Personal", icon: Users },
    { href: "/tables", label: "Mesas", icon: Grid },
  ];

  return (
    <div className="relative flex h-screen overflow-hidden bg-linear-to-br from-[#332013] via-[#0f0a07] to-[#21140c]">
      {/* Panel Lateral Aside */}
      <aside className="hidden md:flex w-64 flex-col justify-between bg-transparent h-full">
        <div>
          {/* Header Logo */}
          <div className="flex h-22 items-center pl-4">
            <Link href="/dashboard" className="text-lg font-bold">
              <img src="/logo-horizontal.png" alt="Logo TuComida" />
            </Link>
          </div>

          {/* Navegacion Principal */}
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon; // Icono
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-[18px] font-bold text-[#EEEEEE] hover:bg-white/5 transition-colors"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Boton Logout */}
        <div className="px-4 pb-4 pt-2">
          <LogoutButton />
        </div>
      </aside>
      
      {/* Area principal */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="flex h-16 md:h-20 items-center justify-between px-4 md:px-8 bg-transparent">
          {/* Menu, Saludo principal */}
          <div className="flex items-center gap-2 md:gap-4">
            <MobileMenu />

            <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2 text-[#EEEEEE]">
              Bienvenido, {session.user.name?.split(" ")[0]} 👋
            </h1>
          </div>
          
          {/* Informacion del usuario / Rol (Estilo foto de referencia) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Imagen */}
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-400 flex items-center justify-center font-bold text-black overflow-hidden">
                {session.user.image ? (
                  <img src={session.user.image} alt="User Avatar" className="h-full w-full object-cover" />
                ) : (
                  session.user.name?.[0] || "U"
                )}
              </div>

              {/* Nombre y Rol Email */}
              <div className="text-right">
                <p className="text-xs md:text-sm font-bold text-white">{session.user.name}</p>
                <p className="hidden sm:block text-xs text-gray-400 font-medium">
                  {/* Muestra el Rol o Email */}
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-[#EEEEEE] backdrop-blur-sm rounded-tl-2xl border-t border-l border-white/10 m-2">{children}</div>
      </main>
    </div>
  );
}
