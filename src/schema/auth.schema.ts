import { z } from "zod";

export const userSchema = z
  .object({
    email: z.string().trim().email().min(5),
    username: z
      .string()
      .trim()
      .min(5, { message: "Username must be at least 5 characters" }),
    password: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password must not exceed 100 characters" })
      .regex(/^(?=.*[a-z]).*$/, {
        message: "Password must contain a lowercase",
      })
      .regex(/^(?=.*[A-Z]).*$/, {
        message: "Password must contain a uppercase",
      })
      .regex(/^(?=.*\d).*$/, {
        message: "Password must contain a number",
      })
      .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
        message: "Password must contain a symbol",
      }),
    confirmPassword: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password must not exceed 100 characters" })
      .regex(/^(?=.*[a-z]).*$/, {
        message: "Password must contain a lowercase",
      })
      .regex(/^(?=.*[A-Z]).*$/, {
        message: "Password must contain a uppercase",
      })
      .regex(/^(?=.*\d).*$/, {
        message: "Password must contain a number",
      })
      .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
        message: "Password must contain a symbol",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email().min(5),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password must not exceed 100 characters" })
      .regex(/^(?=.*[a-z]).*$/, {
        message: "Password must contain a lowercase",
      })
      .regex(/^(?=.*[A-Z]).*$/, {
        message: "Password must contain a uppercase",
      })
      .regex(/^(?=.*\d).*$/, { message: "Password must contain a number" })
      .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
        message: "Password must contain a symbol",
      }),
    confirmPassword: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password must not exceed 100 characters" })
      .regex(/^(?=.*[a-z]).*$/, {
        message: "Password must contain a lowercase",
      })
      .regex(/^(?=.*[A-Z]).*$/, {
        message: "Password must contain a uppercase",
      })
      .regex(/^(?=.*\d).*$/, { message: "Password must contain a number" })
      .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
        message: "Password must contain a symbol",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const verifyEmailSchema = z.object({
  email: z.string().trim().email().min(5),
  otp: z.string().length(4),
});
