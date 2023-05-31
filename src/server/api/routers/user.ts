import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

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
});
