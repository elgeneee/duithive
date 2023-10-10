import {
  editExpenseSchema,
  expenseSchema,
  getPaginatedSchema,
  searchSchema,
} from "@/schema/expense.schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { Budget } from "@prisma/client";
import { z } from "zod";

export const expenseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(expenseSchema)
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

        const createExpense = async (categoryId: number) => {
          const relevantBudgets = await ctx.prisma.budget.findMany({
            where: {
              userId: userId.id,
              categoryId: categoryId,
              startDate: {
                lte: input.date,
              },
              endDate: {
                gte: input.date,
              },
            },
          });

          for (const budget of relevantBudgets) {
            await ctx.prisma.budget.update({
              where: { id: budget.id },
              data: { updatedAt: new Date() },
            });
          }

          const expense = await ctx.prisma.expense.create({
            data: {
              description: input.description,
              amount: input.amount,
              transactionDate: input.date,
              imgUrl: input.imgUrl,
              userId: userId.id,
              categoryId: categoryId,
              budgets: {
                connect: relevantBudgets.map((budget: Budget) => ({
                  id: budget.id,
                })),
              },
            },
          });

          return expense;
        };

        if (!existingCategory) {
          //insert into database
          const newCategory = await ctx.prisma.category.create({
            data: {
              name: input.category.value,
              iconId: input.category.iconId,
            },
          });
          return createExpense(newCategory.id);
        } else {
          return createExpense(existingCategory.id);
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
        const expenses = await ctx.prisma.expense.findMany({
          where: {
            userId: userId.id,
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
            imgUrl: true,
          },
          orderBy: {
            transactionDate: "desc",
          },
        });

        return expenses;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
  getPaginated: protectedProcedure
    .input(getPaginatedSchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const cursor = input.cursor;
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
          const expenses = await ctx.prisma.expense.findMany({
            take: limit + 1,
            where: {
              userId: userId.id,
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
              imgUrl: true,
            },
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
              transactionDate: "desc",
            },
          });

          let nextCursor: typeof cursor | undefined = undefined;
          if (expenses.length > limit) {
            const nextItem = expenses.pop(); // return the last item from the array
            nextCursor = nextItem?.id;
          }
          return {
            expenses,
            nextCursor,
          };
        }
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  search: protectedProcedure
    .input(searchSchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const cursor = input.cursor;
      try {
        if (!input.searchInput) {
          return {
            expenses: undefined,
            nextCursor: undefined,
          };
        }

        const userId = await ctx.prisma.user.findUnique({
          where: {
            email: ctx.session.user.email as string,
          },
          select: {
            id: true,
          },
        });

        if (userId) {
          const expenses = await ctx.prisma.expense.findMany({
            // take: limit + 1,
            // skip: input.skip,
            where: {
              userId: userId.id,
              description: {
                contains: input.searchInput ? input.searchInput : undefined,
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
              imgUrl: true,
            },
            // cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
              transactionDate: "desc",
            },
          });

          let nextCursor: typeof cursor | undefined = undefined;
          if (expenses.length > limit) {
            const nextItem = expenses.pop(); // return the last item from the array
            nextCursor = nextItem?.id;
          }
          return {
            expenses,
            nextCursor,
          };
        }
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  getExpenseReport: protectedProcedure
    .input(
      z.object({ startDate: z.date().optional(), endDate: z.date().optional() })
    )
    .query(async ({ ctx, input }) => {
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
          if (input.startDate && input.endDate) {
            const expenses = await ctx.prisma.expense.findMany({
              where: {
                userId: userId.id,
                transactionDate: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
              select: {
                id: true,
                description: true,
                category: {
                  select: {
                    name: true,
                  },
                },
                transactionDate: true,
                amount: true,
              },
              orderBy: {
                transactionDate: "asc",
              },
            });

            return expenses;
          }
        }
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  deleteExpense: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.expense.update({
          where: {
            id: input.id,
          },
          data: {
            budgets: {
              set: [],
            },
          },
        });

        await ctx.prisma.expense.delete({
          where: {
            id: input.id,
          },
        });
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  editExpense: protectedProcedure
    .input(editExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      try {
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

        const createExpense = async (categoryId: number) => {
          const relevantBudgets = await ctx.prisma.budget.findMany({
            where: {
              userId: userId.id,
              categoryId: categoryId,
              startDate: {
                lte: input.date,
              },
              endDate: {
                gte: input.date,
              },
            },
          });

          for (const budget of relevantBudgets) {
            await ctx.prisma.budget.update({
              where: { id: budget.id },
              data: { updatedAt: new Date() },
            });
          }

          const updateExpense = await ctx.prisma.expense.update({
            where: {
              id: input.id,
            },
            data: {
              description: input.description,
              amount: input.amount,
              transactionDate: input.date,
              categoryId: categoryId,
              budgets: {
                set: relevantBudgets.map((budget) => ({
                  id: budget.id,
                })),
              },
            },
          });

          return updateExpense;
        };

        if (!existingCategory) {
          const newCategory = await ctx.prisma.category.create({
            data: {
              name: input.category.value,
              iconId: input.category.iconId,
            },
          });

          return createExpense(newCategory.id);
        } else {
          return createExpense(existingCategory.id);
        }
      } catch (err) {
        throw new Error(err as string);
      }
    }),
});
