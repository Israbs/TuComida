import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/lib/trpc";
import { inventoryRouter } from "./routers/inventory";
import { hrRouter } from "./routers/hr";
import { attendanceRouter } from "./routers/attendance";
import { ordersRouter } from "./routers/orders";

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
  hr: hrRouter,
  attendance: attendanceRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
