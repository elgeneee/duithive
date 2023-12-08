import { z } from "zod";

export const expenseSchema = z.object({
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, { message: "Must be greater than 0" }),
  date: z.date(),
  category: z.object({
    id: z.number(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
  imgUrl: z.string().optional().nullable(),
});

export const editExpenseSchema = z.object({
  id: z.string(),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, { message: "Must be greater than 0" }),
  date: z.date(),
  category: z.object({
    id: z.number(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
});

export const getPaginatedSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
});

export const searchSchema = z.object({
  searchInput: z.string().optional(),
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  skip: z.number().optional(),
});

export const createBatchSchema = z.object({
  fileName: z.string(),
  records: z.array(
    z.object({
      Description: z
        .string()
        .min(5, { message: "Description must be at least 5 characters" }),
      Amount: z
        .number({
          required_error: "Amount is required",
          invalid_type_error: "Amount must be a number",
        })
        .min(0, { message: "Must be greater than 0" }),
      Category: z.enum([
        "Restaurants",
        "Shopping",
        "Sports",
        "Transport",
        "Groceries",
        "Entertainment",
        "Auto",
      ]),
      Date: z.date(),
      Image: z.string().optional(),
    })
  ),
});
