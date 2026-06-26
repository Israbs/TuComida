import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/lib/trpc";
import { inventoryRouter } from "./routers/inventory";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hola ${input?.text ?? "mundo"}`,
      };
    }),

  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  inventory: inventoryRouter,
});

export type AppRouter = typeof appRouter;
