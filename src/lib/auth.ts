import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    // Sesión corta: el usuario debe volver a loguearse cada X horas.
    // Configurable con SESSION_MAX_AGE_HOURS (por defecto 12).
    maxAge:
      (Number.isFinite(Number(process.env.SESSION_MAX_AGE_HOURS)) &&
        Number(process.env.SESSION_MAX_AGE_HOURS) > 0
        ? Number(process.env.SESSION_MAX_AGE_HOURS)
        : 12) *
      60 *
      60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!user) return null;

        if (!user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        if (user.role) token.role = user.role;
        if (user.tenantId) token.tenantId = user.tenantId;
        if (user.tenantSlug) token.tenantSlug = user.tenantSlug;
        return token;
      }
      // Token existente: validar que el usuario siga existiendo en la base.
      // Si fue borrado o el tenant fue recreado (ej: reseed), se invalida la sesión.
      if (token.sub) {
        const existing = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { id: true },
        });
        if (!existing) return {} as typeof token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "CASHIER" | "COOK" | "WAITER";
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    },
  },
});
