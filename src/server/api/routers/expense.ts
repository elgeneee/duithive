import { editExpenseSchema, expenseSchema } from "@/schema/expense.schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
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
          const expense = await ctx.prisma.expense.create({
            data: {
              description: input.description,
              amount: input.amount,
              transactionDate: input.date,
              imgUrl: input.imgUrl,
              userId: userId.id,
              categoryId: categoryId,
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
  deleteExpense: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
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
        const existingCategory = await ctx.prisma.category.findFirst({
          where: {
            name: input.category.value,
            iconId: input.category.iconId,
          },
        });

        const createExpense = async (categoryId: number) => {
          const updateExpense = await ctx.prisma.expense.update({
            where: {
              id: input.id,
            },
            data: {
              description: input.description,
              amount: input.amount,
              transactionDate: input.date,
              categoryId: categoryId,
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
