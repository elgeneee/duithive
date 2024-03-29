import { z } from "zod";

export const createIncomeSchema = z.object({
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
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
});

export const editIncomeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
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
      Title: z
        .string()
        .min(1, { message: "Title must be at least 1 character" }),
      Description: z
        .string()
        .min(5, { message: "Description must be at least 5 characters" }),
      Amount: z
        .number({
          required_error: "Amount is required",
          invalid_type_error: "Amount must be a number",
        })
        .min(0, { message: "Must be greater than 0" }),
      Date: z.date(),
    })
  ),
});
