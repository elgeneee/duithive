import {
  budgetSchema,
  editBudgetSchema,
  checkBudgetExceedSchema,
} from "@/schema/budget.schema";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const budgetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(budgetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        //getUserId
        const userId = await ctx.prisma.user.findUnique({
          where: {
            email: ctx.session.user.email as string,
          },
          select: {
            id: true,
          },
        });

        if (!userId) {
          throw new Error("User not found");
        }

        const existingCategory = await ctx.prisma.category.findFirst({
          where: {
            name: input.category.value,
            iconId: input.category.iconId,
          },
        });

        const createBudget = async (categoryId: number) => {
          const relevantExpenses = await ctx.prisma.expense.findMany({
            where: {
              userId: userId.id,
              categoryId: categoryId,
              transactionDate: {
                lte: input.endDate,
                gte: input.startDate,
              },
            },
          });

          const budget = await ctx.prisma.budget.create({
            data: {
              title: input.title,
              amount: input.amount,
              startDate: input.startDate,
              endDate: input.endDate,
              userId: userId.id,
              categoryId: categoryId,
              expenses: {
                connect: relevantExpenses.map((expense) => ({
                  id: expense.id,
                })),
              },
            },
          });

          return budget;
        };

        if (!existingCategory) {
          //insert into database
          const newCategory = await ctx.prisma.category.create({
            data: {
              name: input.category.value,
              iconId: input.category.iconId,
            },
          });
          return createBudget(newCategory.id);
        } else {
          return createBudget(existingCategory.id);
        }
      } catch (err) {
        throw new Error(err as string);
      }
    }),
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

        return budgets;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
  deleteBudget: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.budget.update({
          where: {
            id: input.id,
          },
          data: {
            expenses: {
              set: [],
            },
          },
        });

        await ctx.prisma.budget.delete({
          where: {
            id: input.id,
          },
        });
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  editBudget: protectedProcedure
    .input(editBudgetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const updateBudget = await ctx.prisma.budget.update({
          where: {
            id: input.id,
          },
          data: {
            title: input.title,
            amount: input.amount,
          },
        });
        return updateBudget;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  checkBudgetExpiry: publicProcedure.query(async ({ ctx }) => {
    try {
      const currentDate = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const budgets = await ctx.prisma.budget.findMany({
        where: {
          endDate: {
            gte: currentDate,
            lt: new Date(currentDate.getTime() + oneDay),
          },
        },
      });

      const notifications = await ctx.prisma.notification.createMany({
        data: budgets.map((budget) => ({
          message: "Budget is expring soon",
          budgetId: budget.id,
          userId: budget.userId,
        })),
      });

      return notifications;
    } catch (err) {
      throw new Error(err as string);
    }
  }),
  checkBudgetExceed: publicProcedure
    .input(checkBudgetExceedSchema)
    .query(async ({ ctx, input }) => {
      try {
        const budget = await ctx.prisma.budget.findUnique({
          where: {
            id: input.budgetId,
          },
          select: {
            id: true,
            expenses: true,
            amount: true,
            userId: true,
          },
        });

        const totalAmount = budget?.expenses.reduce(
          (sum, entry) => sum + Number(entry.amount),
          0
        );

        if (
          typeof totalAmount === "number" &&
          totalAmount > Number(budget?.amount)
        ) {
          const findNotification = await ctx.prisma.notification.findFirst({
            where: {
              message: "Budget is exceeded",
              budgetId: budget?.id,
              userId: budget?.userId as string,
            },
          });

          if (!findNotification) {
            await ctx.prisma.notification.create({
              data: {
                message: "Budget is exceeded",
                budgetId: budget?.id,
                userId: budget?.userId as string,
              },
            });
          }
        }
        return budget;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
});
