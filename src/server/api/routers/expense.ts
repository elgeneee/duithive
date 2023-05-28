import { expenseSchema } from "@/schema/expense.schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

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
        });

        return expenses;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
});
