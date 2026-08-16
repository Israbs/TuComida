import type { UserRole } from "@/generated/prisma/enums";

const roleAccess: Record<string, UserRole[]> = {
  "/dashboard": ["ADMIN"],
  "/pos": ["ADMIN", "CASHIER"],
  "/kds": ["ADMIN", "COOK"],
  "/inventory": ["ADMIN"],
  "/hr": ["ADMIN"],
  "/tables": ["ADMIN", "CASHIER", "WAITER"],
  "/catalog": ["ADMIN", "CASHIER", "COOK", "WAITER"],
  "/mi-jornada": ["ADMIN", "CASHIER", "COOK", "WAITER"],
  "/attendance": ["ADMIN", "CASHIER"],
};

export const roleHome: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  CASHIER: "/attendance",
  COOK: "/mi-jornada",
  WAITER: "/mi-jornada",
};

export function canAccess(
  role: UserRole | undefined,
  pathname: string,
): boolean {
  if (!role) return false;
  const allowed = roleAccess[pathname];
  return allowed?.includes(role) ?? false;
}

export function findSectionRoles(pathname: string): UserRole[] | null {
  for (const [route, roles] of Object.entries(roleAccess)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return roles;
  }
  return null;
}