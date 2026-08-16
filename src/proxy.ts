import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";
import { findSectionRoles, roleHome } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

async function getSessionInfo(
  req: NextRequest,
): Promise<{ role: UserRole; sub: string } | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  for (const name of SESSION_COOKIE_NAMES) {
    const token = req.cookies.get(name)?.value;
    if (!token) continue;
    try {
      const jwt = await decode({ token, salt: name, secret });
      const role = jwt?.role as UserRole | undefined;
      if (role && jwt?.sub) return { role, sub: jwt.sub as string };
    } catch {
      // cookie de otro secret o expirada; probar el siguiente nombre
    }
  }
  return null;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getSessionInfo(req);
  const role = session?.role ?? null;
  const sectionRoles = findSectionRoles(pathname);

  // Sesión inválida: el usuario ya no existe (borrado o reseed). Limpiar cookie y a login.
  if (session && !(await prisma.user.findUnique({ where: { id: session.sub }, select: { id: true } }))) {
    const login = NextResponse.redirect(new URL("/login", req.nextUrl));
    for (const name of SESSION_COOKIE_NAMES) login.cookies.delete(name);
    return login;
  }

  if (sectionRoles && !role) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (sectionRoles && role && !sectionRoles.includes(role)) {
    return NextResponse.redirect(new URL(roleHome[role], req.nextUrl));
  }

  if (role && pathname === "/login") {
    return NextResponse.redirect(new URL(roleHome[role], req.nextUrl));
  }

  if (role && pathname === "/register") {
    return NextResponse.redirect(new URL(roleHome[role], req.nextUrl));
  }

  if (role && pathname === "/") {
    return NextResponse.redirect(new URL(roleHome[role], req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};