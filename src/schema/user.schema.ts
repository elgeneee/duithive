import { z } from "zod";

export const userSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(5, { message: "Username must be at least 5 characters" }),
  email: z.string().email().min(5),
  image: z.string().optional().nullable(),
  currencyId: z.number(),
});

export const userNotificationSchema = z.object({
  email: z.string().email().min(5),
  notification: z.boolean().nullable(),
  monthlyReport: z.boolean().nullable(),
});
