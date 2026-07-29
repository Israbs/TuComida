"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed, 
  Boxes, 
  Users, 
  Grid 
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

// Definimos la lista dentro del Client Component o pasamos un ID/string para el ícono
const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
  { href: "/kds", label: "Cocina", icon: UtensilsCrossed },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/hr", label: "Personal", icon: Users },
  { href: "/tables", label: "Mesas", icon: Grid },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Boton de apertura */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-[#EEEEEE] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay Oscuro y Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 flex w-64 flex-col justify-between bg-brand-surface/30 p-4 text-[#EEEEEE] shadow-xl border-r border-white/10">
            <div>
              <div className="flex items-center justify-between h-16 border-b border-white/10 pb-2">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-bold"
                >
                  <img src="/logo-horizontal.png" alt="Logo TuComida" className="h-16 pl-6 object-contain" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Enlaces de Navegacion */}
              <nav className="mt-4 space-y-1">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-bold text-[#EEEEEE] hover:bg-white/10 transition-colors"
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}