"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarShare } from "@/components/sidebar-share";

export type NavItem = { href: string; label: string };
export type ShellUser = { name: string | null; email: string | null };

function NavLinks({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ user }: { user: ShellUser }) {
  return (
    <div className="border-t border-sidebar-border p-4">
      <p className="text-sm text-sidebar-foreground">{user.name}</p>
      <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
      <SignOutButton />
    </div>
  );
}

export function DashboardShell({
  navItems,
  user,
  homeHref,
  catalogUrl,
  children,
}: {
  navItems: NavItem[];
  user: ShellUser;
  homeHref: string;
  catalogUrl?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const shareCard = catalogUrl ? <SidebarShare url={catalogUrl} /> : null;

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar border-sidebar-border lg:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-6">
          <Link href={homeHref} className="text-lg font-bold text-sidebar-foreground">
            TuComida
          </Link>
        </div>
        <NavLinks navItems={navItems} pathname={pathname} />
        {shareCard}
        <UserFooter user={user} />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b bg-background px-4 lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Abrir menú" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 max-w-[85vw] bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="flex h-14 items-center border-b border-sidebar-border px-6">
                <Link
                  href={homeHref}
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-bold text-sidebar-foreground"
                >
                  TuComida
                </Link>
              </div>
              <NavLinks
                navItems={navItems}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />
              {shareCard}
              <UserFooter user={user} />
            </SheetContent>
          </Sheet>

          <Link href={homeHref} className="text-lg font-bold">
            TuComida
          </Link>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {user.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
        </header>

        <header className="hidden h-14 items-center justify-between border-b px-6 lg:flex">
          <h2 className="text-lg font-semibold">Bienvenido, {user.name}</h2>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-6">{children}</main>
      </div>
    </div>
  );
}