import {
  createIncomeSchema,
  editIncomeSchema,
  getPaginatedSchema,
  searchSchema,
} from "@/schema/income.schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const incomeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createIncomeSchema)
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

        const income = await ctx.prisma.income.create({
          data: {
            title: input.title,
            description: input.description,
            amount: input.amount,
            transactionDate: input.date,
            userId: userId.id,
          },
        });

        return income;
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
        const incomes = await ctx.prisma.income.findMany({
          where: {
            userId: userId.id,
          },
          select: {
            id: true,
            title: true,
            description: true,
            amount: true,
            transactionDate: true,
          },
          orderBy: {
            transactionDate: "desc",
          },
        });

        if (incomes) {
          return incomes;
        }

        return [];
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
          const incomes = await ctx.prisma.income.findMany({
            take: limit + 1,
            where: {
              userId: userId.id,
            },
            select: {
              id: true,
              title: true,
              description: true,
              amount: true,
              transactionDate: true,
            },
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
              transactionDate: "desc",
            },
          });

          let nextCursor: typeof cursor | undefined = undefined;
          if (incomes.length > limit) {
            const nextItem = incomes.pop(); // return the last item from the array
            nextCursor = nextItem?.id;
          }
          return {
            incomes,
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
            incomes: undefined,
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
          const incomes = await ctx.prisma.income.findMany({
            // take: limit + 1,
            // skip: input.skip,
            where: {
              userId: userId.id,
              OR: [
                {
                  title: {
                    contains: input.searchInput ? input.searchInput : undefined,
                  },
                },
                {
                  description: {
                    contains: input.searchInput ? input.searchInput : undefined,
                  },
                },
              ],
            },
            select: {
              id: true,
              title: true,
              description: true,
              amount: true,
              transactionDate: true,
            },
            // cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
              transactionDate: "desc",
            },
          });

          let nextCursor: typeof cursor | undefined = undefined;
          if (incomes.length > limit) {
            const nextItem = incomes.pop(); // return the last item from the array
            nextCursor = nextItem?.id;
          }
          return {
            incomes: incomes,
            nextCursor,
          };
        }
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  editIncome: protectedProcedure
    .input(editIncomeSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const editIncome = await ctx.prisma.income.update({
          where: {
            id: input.id,
          },
          data: {
            title: input.title,
            description: input.description,
            amount: input.amount,
            transactionDate: input.date,
          },
        });

        return editIncome;
      } catch (err) {
        throw new Error(err as string);
      }
    }),

  deleteIncome: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.income.delete({
          where: {
            id: input.id,
          },
        });
      } catch (err) {
        throw new Error(err as string);
      }
    }),
});
