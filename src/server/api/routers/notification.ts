import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const notificationRouter = createTRPCRouter({
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
        const notifications = await ctx.prisma.notification.findMany({
          where: {
            userId: userId.id,
          },
          select: {
            id: true,
            budget: {
              select: {
                id: true,
                title: true,
              },
            },
            read: true,
            message: true,
            createdAt: true,
            notificationType: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return notifications;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
  markAllAsRead: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const notifications = await ctx.prisma.notification.updateMany({
          where: {
            user: {
              email: input.email,
            },
          },
          data: {
            read: true,
          },
        });

        return notifications;
      } catch (err) {
        throw new Error(err as string);
      }
      return;
    }),
});
