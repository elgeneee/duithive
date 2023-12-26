import {
  budgetSchema,
  editBudgetSchema,
  checkBudgetExceedSchema,
  getPaginatedSchema,
  searchSchema,
} from "@/schema/budget.schema";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { budgetExceedTemplate } from "@/store/budget-exceed";
import { budgetExpiredTemplate } from "@/store/budget-expired";
import nodemailer from "nodemailer";
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

const transporter = nodemailer.createTransport({
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

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
        const { success } = await ratelimit.limit(userId.id);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });

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
                lte: new Date(input.endDate.setHours(23, 59, 59, 999)),
                gte: new Date(input.startDate.setHours(0, 0, 0, 0)),
              },
            },
          });

          const budget = await ctx.prisma.budget.create({
            data: {
              title: input.title,
              amount: input.amount,
              startDate: new Date(input.startDate.setHours(0, 0, 0, 0)),
              endDate: new Date(input.endDate.setHours(23, 59, 59, 999)),
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
          const budgets = await ctx.prisma.budget.findMany({
            take: limit + 1,
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
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
              endDate: "desc",
            },
          });

          let nextCursor: typeof cursor | undefined = undefined;
          if (budgets.length > limit) {
            const nextItem = budgets.pop(); // return the last item from the array
            nextCursor = nextItem?.id;
          }
          return {
            budgets,
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
        if (!input.name) {
          return {
            budgets: undefined,
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
          const budgets = await ctx.prisma.budget.findMany({
            // take: limit + 1,
            // skip: input.skip,
            where: {
              userId: userId.id,
              title: {
                contains: input.name ? input.name : undefined,
              },
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
            // cursor: cursor ? { id: cursor } : undefined,
            orderBy: {
              endDate: "desc",
            },
          });

          let nextCursor: typeof cursor | undefined = undefined;
          if (budgets.length > limit) {
            const nextItem = budgets.pop(); // return the last item from the array
            nextCursor = nextItem?.id;
          }
          return {
            budgets: budgets,
            nextCursor,
          };
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
        select: {
          id: true,
          title: true,
          user: {
            select: {
              id: true,
              email: true,
              notification: true,
            },
          },
        },
      });

      const notifications = await ctx.prisma.notification.createMany({
        data: budgets.map((budget) => ({
          message: "Budget is expring soon",
          budgetId: budget.id,
          userId: budget.user.id,
          notificationType: "BUDGETEXPIRED",
        })),
      });

      const updatedBudgets = budgets.filter(
        (budget) => budget.user.notification
      );

      //slice into batches (fan-out method)
      const totalBudgetLength = updatedBudgets.length;

      for (let i = 0; i < totalBudgetLength; i += 100) {
        const batch = updatedBudgets.slice(i, i + 100);
        const emailPromises = batch.map(async (budget) => {
          const options = {
            from: process.env.NODEMAILER_EMAIL,
            to: budget.user.email as string,
            subject: "[DuitHive] Your budget is expiring soon",
            html: budgetExpiredTemplate(budget.title),
          };

          // Send email and return a promise
          return transporter.sendMail(options);
        });
        await Promise.all(emailPromises);
      }

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
            title: true,
            amount: true,
            user: {
              select: {
                id: true,
                email: true,
                notification: true,
                currency: {
                  select: {
                    symbol: true,
                  },
                },
              },
            },
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
              userId: budget?.user.id as string,
            },
          });

          if (!findNotification) {
            await ctx.prisma.notification.create({
              data: {
                message: "Budget is exceeded",
                budgetId: budget?.id,
                userId: budget?.user.id as string,
                notificationType: "BUDGETEXCEED",
              },
            });

            if (budget?.user.notification) {
              //generate email
              const options = {
                from: process.env.NODEMAILER_EMAIL,
                to: budget.user.email as string,
                subject: "[DuitHive] Your budget is exceeded",
                html: budgetExceedTemplate(
                  budget.title,
                  budget.user.currency?.symbol as string,
                  parseFloat(budget.amount.toString()).toFixed(2)
                ),
              };

              //send email
              await transporter.sendMail(options);
            }
          }
        }
        return budget;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
});
