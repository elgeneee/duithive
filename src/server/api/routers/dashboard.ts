import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = await ctx.prisma.user.findUnique({
        where: {
          email: ctx.session.user.email as string,
        },
        select: {
          id: true,
        },
      });

      if (userId) {
        const currDate = new Date();
        const startDate = new Date(
          currDate.getFullYear() - 1,
          currDate.getMonth(),
          currDate.getDate()
        );
        const endDate = new Date(
          currDate.getFullYear(),
          currDate.getMonth() + 1,
          0
        );
        const expenses = await ctx.prisma.expense.findMany({
          where: {
            userId: userId.id,
            transactionDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            description: true,
            category: {
              select: {
                name: true,
                iconId: true,
              },
            },
            amount: true,
            transactionDate: true,
          },
          orderBy: {
            transactionDate: "asc",
          },
        });

        const incomes = await ctx.prisma.income.findMany({
          where: {
            userId: userId.id,
            transactionDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            amount: true,
            transactionDate: true,
          },
          orderBy: {
            transactionDate: "asc",
          },
        });

        const budgets = await ctx.prisma.budget.findMany({
          where: {
            userId: userId.id,
          },
          select: {
            id: true,
            title: true,
            category: {
              select: {
                name: true,
                iconId: true,
              },
            },
            amount: true,
            startDate: true,
            endDate: true,
            expenses: true,
          },
          orderBy: {
            endDate: "desc",
          },
        });

        return { incomes: incomes, expenses: expenses, budgets: budgets };
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
});
