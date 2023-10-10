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

export const checkBudgetExceedSchema = z.object({
  budgetId: z.string(),
});

export const getPaginatedSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
});

export const searchSchema = z.object({
  name: z.string().optional(),
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  skip: z.number().optional(),
});
