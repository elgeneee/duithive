import { createTRPCRouter } from "@/server/api/trpc";
// import { exampleRouter } from "@/server/api/routers/example";
import { authRouter } from "@/server/api/routers/auth";
import { expenseRouter } from "@/server/api/routers/expense";
import { incomeRouter } from "@/server/api/routers/income";
import { userRouter } from "@/server/api/routers/user";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { budgetRouter } from "@/server/api/routers/budget";
import { reportRouter } from "@/server/api/routers/report";
import { notificationRouter } from "@/server/api/routers/notification";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // example: exampleRouter,
  auth: authRouter,
  expense: expenseRouter,
  income: incomeRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  budget: budgetRouter,
  report: reportRouter,
  notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
