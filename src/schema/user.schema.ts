import { z } from "zod";

export const userSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(5, { message: "Username must be at least 5 characters" }),
  email: z.string().email().min(5),
  image: z.string().optional().nullable(),
  currencyId: z.number(),
  favCat1: z
    .object({
      value: z.string().nullable(),
      label: z.string().nullable(),
      iconId: z.number().nullable(),
    })
    .nullable(),
  favCat2: z
    .object({
      value: z.string().nullable(),
      label: z.string().nullable(),
      iconId: z.number().nullable(),
    })
    .nullable(),
  favCat3: z
    .object({
      value: z.string().nullable(),
      label: z.string().nullable(),
      iconId: z.number().nullable(),
    })
    .nullable(),
});

export const userNotificationSchema = z.object({
  email: z.string().email().min(5),
  notification: z.boolean().nullable(),
  monthlyReport: z.boolean().nullable(),
});
