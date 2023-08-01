import { z } from "zod";

export const budgetSchema = z.object({
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  startDate: z.date(),
  endDate: z.date(),
  category: z.object({
    id: z.number(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
});

export const editBudgetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
});
