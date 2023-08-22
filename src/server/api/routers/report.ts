import { reportSchema } from "@/schema/report.schema";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
// import createTemplate from "@/pages/test";

export const reportRouter = createTRPCRouter({
  create: protectedProcedure
    .input(reportSchema)
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

        const report = await ctx.prisma.report.create({
          data: {
            fileName: input.fileName,
            url: input.url,
            userId: userId.id,
          },
        });

        return report;
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
        const reports = await ctx.prisma.report.findMany({
          where: {
            userId: userId.id,
          },
          select: {
            id: true,
            fileName: true,
            url: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reports;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
  // createMonthlyReport: publicProcedure.query(async ({ ctx }) => {
  //   try {
  //     const userId = await ctx.prisma.user.findUnique({
  //       where: {
  //         email: ctx.session.user.email as string,
  //       },
  //       select: {
  //         id: true,
  //       },
  //     });

  //     if (userId) {
  //       const reports = await ctx.prisma.report.findMany({
  //         where: {
  //           userId: userId.id,
  //         },
  //         select: {
  //           id: true,
  //           fileName: true,
  //           url: true,
  //           createdAt: true,
  //         },
  //         orderBy: {
  //           createdAt: "desc",
  //         },
  //       });

  //       return reports;
  //     }
  //   } catch (err) {
  //     throw new Error(err as string);
  //   }
  // }),
});
