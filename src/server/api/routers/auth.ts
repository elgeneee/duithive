import {
  userSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
} from "@/schema/auth.schema";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { resetPasswordTemplate } from "@/store/reset-password";
import { otpTemplate } from "@/store/otp";
const transporter = nodemailer.createTransport({
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});
import { Prisma } from "@prisma/client";
//rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Create a new ratelimiter, that allows 3 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "10 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});
interface DecodedToken {
  user_id: string;
  iat: number;
  exp: number;
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(userSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const hash = await bcrypt.hash(input.password, 10);
        const otp = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        const user = await ctx.prisma.user.create({
          data: {
            email: input.email,
            password: hash,
            name: input.username,
            otp: otp,
          },
        });

        //generate email
        const options = {
          from: process.env.NODEMAILER_EMAIL,
          to: input.email,
          subject: "[DuitHive] Verify Email",
          html: otpTemplate(otp),
        };
        const info = await transporter.sendMail(options);
        return { user, ...info };
      } catch (err) {
        if (typeof err === "string") {
          throw new Error(err);
        } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === "P2002") {
            throw new Error("User exists! Try using another email");
          }
        } else {
          throw new Error("An error occurred!");
        }
      }
    }),
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          id: true,
        },
      });

      if (!userId) {
        throw new Error("User not found");
      }

      const { success } = await ratelimit.limit(userId.id);

      if (!success)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests, try again later",
        });

      const token = jwt.sign(
        { user_id: userId.id },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "2h",
        }
      );

      //generate email
      const options = {
        from: process.env.NODEMAILER_EMAIL,
        to: input.email,
        subject: "[DuitHive] Reset your password here",
        html: resetPasswordTemplate(token),
      };

      try {
        const info = await transporter.sendMail(options);
        return info;
      } catch (err) {
        if (typeof err === "string") {
          throw new Error(err);
        } else {
          throw new Error("An error occurred");
        }
      }
    }),
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      //verify jwt
      try {
        const decoded = jwt.verify(
          input.token,
          process.env.JWT_SECRET as string
        ) as DecodedToken;
        const userId = decoded.user_id;
        const hashPassword = await bcrypt.hash(input.password, 10);

        await ctx.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            password: hashPassword,
          },
        });
      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
          throw new Error("Invalid token");
        } else {
          throw new Error(err as string);
        }
      }
    }),
  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const userOTP = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          otp: true,
        },
      });

      if (!userOTP) throw new Error("User not found!");

      if (userOTP.otp !== input.otp) throw new Error("Wrong OTP!");

      try {
        await ctx.prisma.user.update({
          where: {
            email: input.email,
          },
          data: {
            verified: true,
          },
        });
      } catch (err) {
        throw new Error(err as string);
      }

      return {
        message: "Email Verified!",
      };
    }),
  // getSecretMessage: protectedProcedure.query(() => {
  //   return "you can now see this secret message!";
  // }),
});
