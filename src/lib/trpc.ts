import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Session } from "next-auth";
import { auth } from "./auth";

type SessionUser = Session["user"];

const t = initTRPC.context<{ user?: SessionUser }>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(async ({ next, ctx }) => {
  if (ctx.user) {
    return next({ ctx: { user: ctx.user } });
  }
  const session = await auth();
  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

const isAdmin = t.middleware(async ({ next, ctx }) => {
  const user = ctx.user;
  if (!user || user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requiere rol ADMIN",
    });
  }
  return next({ ctx: { user } });
});

export const adminProcedure = protectedProcedure.use(isAdmin);

const isManager = t.middleware(async ({ next, ctx }) => {
  const user = ctx.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "CASHIER")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requiere rol ADMIN o CAJERO",
    });
  }
  return next({ ctx: { user } });
});

export const managerProcedure = protectedProcedure.use(isManager);
