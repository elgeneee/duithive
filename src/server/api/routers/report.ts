/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { reportSchema } from "@/schema/report.schema";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import fs from "fs-extra";
import puppeteer from "puppeteer";
import hbs from "handlebars";
import path from "path";
import { monthlyReportTemplate } from "@/store/monthly-report";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

const compile = async (
  templateName: string,
  startDate: string,
  endDate: string,
  currency: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any
) => {
  const filePath = path.join(process.cwd(), "src/lib", `${templateName}.hbs`);
  const html = await fs.readFile(filePath, "utf-8");
  const template = hbs.compile(html);
  const totalAmount = generateTotalExpense(expenses);
  const compiledHtml = template({
    startDate: startDate,
    endDate: endDate,
    currency: currency,
    expenses: expenses,
    totalAmount: totalAmount,
  });
  return compiledHtml;
};

const generateTotalExpense = (expenses: any) => {
  const totalAmount = expenses.reduce(
    (accumulator: any, currentObject: any) => {
      return accumulator + parseFloat(currentObject.amount);
    },
    0
  );
  return totalAmount;
};

hbs.registerHelper("dateFormat", function (value: Date) {
  return value.toLocaleDateString();
});

hbs.registerHelper("amountFormat", function (value: number) {
  return parseFloat(value.toString()).toFixed(2);
});

export const reportRouter = createTRPCRouter({
  create: protectedProcedure
    .input(reportSchema)
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

        const report = await ctx.prisma.report.create({
          data: {
            fileName: input.fileName,
            url: input.url,
            userId: userId.id,
          },
        });

        return report;
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
        const reports = await ctx.prisma.report.findMany({
          where: {
            userId: userId.id,
          },
          select: {
            id: true,
            fileName: true,
            url: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reports;
      }
    } catch (err) {
      throw new Error(err as string);
    }
  }),
  createMonthlyReport: publicProcedure.query(async ({ ctx }) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth());
    endDate.setDate(0);

    const emailSubject = `Monthly Spending Recap: ${startDate.toLocaleString(
      "en-US",
      { month: "short" }
    )} ${startDate.getFullYear()}`;
    try {
      //1. fetch all user emails that have toggled 'On'
      const users = await ctx.prisma.user.findMany({
        where: {
          monthlyReport: true,
        },
        select: {
          id: true,
          email: true,
          currency: true,
        },
      });

      //2. build the pdf
      for (let i = 0; i < users.length; i++) {
        //2.1 fetch all expenses based on user
        const userExpenses = await ctx.prisma.expense.findMany({
          where: {
            user: {
              email: users[i]?.email,
            },
            transactionDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            description: true,
            category: {
              select: {
                name: true,
              },
            },
            transactionDate: true,
            amount: true,
          },
          orderBy: {
            transactionDate: "asc",
          },
        });

        //2.2 build pdf
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        const content = await compile(
          "report",
          startDate.toLocaleDateString(),
          endDate.toLocaleDateString(),
          users[i]?.currency?.symbol || "$",
          userExpenses
        );

        await page.setContent(content);
        await page.pdf({
          path: "./output.pdf",
          format: "A4",
          printBackground: true,
        });

        await browser.close();

        //cloudinary upload
        const formData = new FormData();
        const pdfBlob = new Blob([fs.readFileSync("./output.pdf")], {
          type: "application/pdf",
        });
        formData.append("file", pdfBlob);
        formData.append("upload_preset", "oxd8flh9");
        formData.append(
          "public_id",
          `duithive_monthlyreport_${startDate
            .toLocaleString("en-US", {
              month: "short",
            })
            .toLowerCase()}_${startDate.getFullYear()}`
        );
        formData.append(
          "folder",
          `duithive/users/${users[i]?.email as string}/report`
        );
        const cloudinaryUpload = await fetch(
          "https://api.cloudinary.com/v1_1/dlidl2li4/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const cloudinaryResponse = await cloudinaryUpload.json();

        //upload to report db
        await ctx.prisma.report.create({
          data: {
            fileName: `duithive_monthlyreport_${startDate
              .toLocaleString("en-US", {
                month: "short",
              })
              .toLowerCase()}_${startDate.getFullYear()}`,
            url: cloudinaryResponse.secure_url,
            userId: users[i]?.id as string,
          },
        });

        //3 send email
        const options = {
          from: process.env.NODEMAILER_EMAIL,
          to: users[i]?.email as string,
          subject: emailSubject,
          html: monthlyReportTemplate(cloudinaryResponse.secure_url),
        };

        await transporter.sendMail(options);
      }
      return { message: "ok" };
    } catch (err) {
      throw new Error(err as string);
    }
  }),
});
