/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import {
  userSettingsSchema,
  userNotificationSchema,
} from "@/schema/user.schema";
import { TRPCClientError } from "@trpc/client";
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

export const userRouter = createTRPCRouter({
  getUserCurrency: publicProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .query(async ({ ctx, input }) => {
      try {
        const userCurrency = await ctx.prisma.user.findUnique({
          where: {
            email: input.email,
          },
          select: {
            currency: true,
          },
        });

        if (!userCurrency) {
          throw new Error("User not found");
        }

        return userCurrency.currency;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  getUserSettings: publicProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .query(async ({ ctx, input }) => {
      try {
        const userSettings = await ctx.prisma.user.findUnique({
          where: {
            email: input.email,
          },
          select: {
            name: true,
            email: true,
            currency: true,
            image: true,
            notification: true,
            monthlyReport: true,
            favoriteCategory1: true,
            favoriteCategory2: true,
            favoriteCategory3: true,
          },
        });

        if (!userSettings) {
          throw new Error("User not found");
        }

        return userSettings;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  getUserFavoriteCategories: publicProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .query(async ({ ctx, input }) => {
      try {
        const userSettings = await ctx.prisma.user.findUnique({
          where: {
            email: input.email,
          },
          select: {
            favoriteCategory1: true,
            favoriteCategory2: true,
            favoriteCategory3: true,
          },
        });

        if (!userSettings) {
          throw new Error("User not found");
        }

        return userSettings;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  resetFav1Category: protectedProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { success } = await ratelimit.limit(input.email);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });

        await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            favoriteCategory1Id: null,
          },
        });
      } catch (err) {
        if (typeof err === "string") {
          throw new TRPCClientError(err);
        } else {
          throw new Error("An error occurred");
        }
      }
    }),
  resetFav2Category: protectedProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { success } = await ratelimit.limit(input.email);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });

        await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            favoriteCategory2Id: null,
          },
        });
      } catch (err) {
        if (typeof err === "string") {
          throw new TRPCClientError(err);
        } else {
          throw new Error("An error occurred");
        }
      }
    }),
  resetFav3Category: protectedProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { success } = await ratelimit.limit(input.email);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });

        await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            favoriteCategory3Id: null,
          },
        });
      } catch (err) {
        if (typeof err === "string") {
          throw new TRPCClientError(err);
        } else {
          throw new Error("An error occurred");
        }
      }
    }),
  editProfile: protectedProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { success } = await ratelimit.limit(input.email);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });

        let catRes1, catRes2, catRes3;

        if (input.favCat1) {
          catRes1 = await ctx.prisma.category.findFirst({
            where: {
              name: input.favCat1.value,
              iconId: input.favCat1.iconId || undefined,
            },
          });

          if (!catRes1) {
            catRes1 = await ctx.prisma.category.create({
              data: {
                name: input.favCat1.value,
                iconId: input.favCat1?.iconId as number,
              },
            });
          }
        }

        if (input.favCat2) {
          catRes2 = await ctx.prisma.category.findFirst({
            where: {
              name: input.favCat2.value,
              iconId: input.favCat2.iconId || undefined,
            },
          });

          if (!catRes2) {
            catRes2 = await ctx.prisma.category.create({
              data: {
                name: input.favCat2.value,
                iconId: input.favCat2?.iconId as number,
              },
            });
          }
        }

        if (input.favCat3) {
          catRes3 = await ctx.prisma.category.findFirst({
            where: {
              name: input.favCat3.value,
              iconId: input.favCat3.iconId || undefined,
            },
          });

          if (!catRes3) {
            catRes3 = await ctx.prisma.category.create({
              data: {
                name: input.favCat3.value,
                iconId: input.favCat3?.iconId as number,
              },
            });
          }
        }

        const updateUser = await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            name: input.username,
            ...(input.image && { image: input.image }),
            ...(catRes1 && { favoriteCategory1Id: catRes1.id }),
            ...(catRes2 && { favoriteCategory2Id: catRes2.id }),
            ...(catRes3 && { favoriteCategory3Id: catRes3.id }),
            currencyId: input.currencyId,
          },
        });

        return {
          id: updateUser.id,
          currencyId: updateUser.currencyId,
          name: updateUser.name,
          image: updateUser.image,
        };
      } catch (err) {
        if (typeof err === "string") {
          throw new TRPCClientError(err);
        } else {
          throw new Error("An error occurred");
        }
      }
    }),
  editNotification: protectedProcedure
    .input(userNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { success } = await ratelimit.limit(input.email);

        if (!success)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, try again later",
          });
        const updateUser = await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            notification: input.notification as boolean,
            monthlyReport: input.monthlyReport as boolean,
          },
        });

        return {
          id: updateUser.id,
          email: updateUser.email,
          notification: updateUser.notification,
        };
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  getUserImage: publicProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .query(async ({ ctx, input }) => {
      try {
        const userImage = await ctx.prisma.user.findUnique({
          where: {
            email: input.email,
          },
          select: {
            image: true,
          },
        });

        if (!userImage) {
          throw new Error("User not found");
        }

        return userImage;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  getUserNavInfo: publicProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .query(async ({ ctx, input }) => {
      try {
        const userImage = await ctx.prisma.user.findUnique({
          where: {
            email: input.email,
          },
          select: {
            image: true,
            name: true,
          },
        });

        if (!userImage) {
          throw new Error("User not found");
        }

        return userImage;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  deleteAccount: protectedProcedure
    .input(z.object({ email: z.string().email().min(5) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const deleteUser = await ctx.prisma.user.delete({
          where: {
            email: input.email,
          },
        });

        return deleteUser;
      } catch (err) {
        throw new Error(err as string);
      }
    }),
  // getUserWithMonthlyReport: publicProcedure.query(async ({ ctx }) => {
  //   try {
  //     const users = await ctx.prisma.user.findMany({
  //       where: {
  //         monthlyReport: true,
  //       },
  //       select: {
  //         id: true,
  //         email: true,
  //         currency: true,
  //       },
  //     });

  //     return users;
  //   } catch (err) {
  //     throw new Error(err as string);
  //   }
  // }),
});
