import {
  createIncomeSchema,
  editIncomeSchema,
  getPaginatedSchema,
  searchSchema,
  createBatchSchema,
} from "@/schema/income.schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

//rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Create a new ratelimiter, that allows 3 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "10 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

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

        const { success } = await ratelimit.limit(userId.id);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });

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
  createBatchIncome: protectedProcedure
    .input(createBatchSchema)
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

        const incomeRecords = input.records.map((record) => {
          return {
            title: record.Title,
            description: record.Description,
            amount: record.Amount,
            transactionDate: record.Date,
            userId: userId.id,
          };
        });

        const incomes = await ctx.prisma.income.createMany({
          data: incomeRecords,
        });

        await ctx.prisma.batchCreate.create({
          data: {
            fileName: input.fileName,
            success: incomes.count,
            failed: 0,
            userId: userId.id,
            type: "INCOME",
          },
        });

        return incomes;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  getBatchIncome: protectedProcedure.query(async ({ ctx }) => {
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
        const uploadedRecords = await ctx.prisma.batchCreate.findMany({
          where: {
            userId: userId.id,
            type: "INCOME",
          },
          select: {
            id: true,
            fileName: true,
            success: true,
            failed: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return uploadedRecords;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
});
