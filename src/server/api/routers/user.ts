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
  editProfile: protectedProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const updateUser = await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            name: input.username,
            ...(input.image && { image: input.image }),
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
