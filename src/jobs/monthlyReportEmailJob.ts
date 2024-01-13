/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type GetEvents, Inngest } from "inngest";
import { PrismaClient } from "@prisma/client";
// import puppeteer from "puppeteer";
import puppeteer from "puppeteer-core";
import fs from "fs-extra";
import hbs from "handlebars";
import path from "path";
import chromium from "@sparticuz/chromium-min";
const prisma = new PrismaClient();
const inngest = new Inngest({ id: "duithive" });
type Events = GetEvents<typeof inngest>;

const compile = async (
  templateName: string,
  startDate: string,
  endDate: string,
  currency: string,
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
    totalAmount: totalAmount.toString(),
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
  return parseFloat(totalAmount.toString()).toFixed(2);
};

hbs.registerHelper("dateFormat", function (value: Date) {
  const dateObject = new Date(value);
  return dateObject.toLocaleDateString();
});

hbs.registerHelper("amountFormat", function (value: number) {
  return parseFloat(value.toString()).toFixed(2);
});

export const monthlyReportEmailJob = inngest.createFunction(
  {
    id: "monthly-activity-send-report",
    batchEvents: { maxSize: 100, timeout: "60s" },
  },
  { cron: "0 1 * * *" },
  async ({ step }) => {
    const results = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);

    const endDate = new Date();
    endDate.setFullYear(2023);
    endDate.setMonth(11);
    endDate.setDate(31);

    // Fetch all users
    const users = await step.run("fetch-users", async () => {
      return prisma.user.findMany({
        where: {
          monthlyReport: true,
        },
        select: {
          id: true,
          email: true,
          currency: true,
        },
      });
    });

    // const browser = await puppeteer.launch({
    //   headless: "new",
    //   args: [
    //     `--no-sandbox`,
    //     `--headless`,
    //     `--disable-gpu`,
    //     `--disable-dev-shm-usage`,
    //   ],
    // });

    // const browser = await puppeteer.launch({
    //   executablePath: await edgeChromium.executablePath,
    //   args: edgeChromium.args,
    //   headless: false,
    // });
    let browser;
    if (process.env.NODE_ENV === "production") {
      // browser = await puppeteer.launch({
      //   args: [
      //     ...chromium.args,
      //     "--hide-scrollbars",
      //     "--disable-web-security",
      //   ],
      //   defaultViewport: chromium.defaultViewport,
      //   executablePath: await chromium.executablePath(
      //     `https://github.com/Sparticuz/chromium/releases/download/v115.0.0/chromium-v115.0.0-pack.tar`
      //   ),
      //   headless: chromium.headless,
      //   ignoreHTTPSErrors: true,
      // });
      browser = await puppeteer.launch({
        args: [...chromium.args, "--disable-gpu"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
          `https://github.com/Sparticuz/chromium/releases/download/v115.0.0/chromium-v115.0.0-pack.tar`
        ),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: "new",
      });
    }

    //build the pdf
    for (const user of users) {
      //fetch user expenses
      const userExpenses = await step.run(
        `fetch-user-${user.id}-expenses`,
        async () => {
          return prisma.expense.findMany({
            where: {
              user: {
                email: user.email,
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
        }
      );

      const page = await browser.newPage();

      const content = await compile(
        "report",
        startDate.toLocaleDateString("en-GB"),
        endDate.toLocaleDateString("en-GB"),
        user?.currency?.symbol || "$",
        userExpenses
      );

      await page.setContent(content);
      await page.pdf({
        path: "/tmp/output.pdf",
        format: "A4",
        printBackground: true,
      });

      // page.removeAllListeners();
      await page.close();

      //cloudinary upload
      const formData = new FormData();
      const pdfBlob = new Blob([fs.readFileSync("/tmp/output.pdf")], {
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
        `duithive/users/${user?.email as string}/report`
      );
      const cloudinaryUpload = await fetch(
        "https://api.cloudinary.com/v1_1/dlidl2li4/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudinaryResponse = await cloudinaryUpload.json();

      results.push({
        email: user.email,
        url: cloudinaryResponse.secure_url,
        userId: user.id,
        fileName: `duithive_monthlyreport_${startDate
          .toLocaleString("en-US", {
            month: "short",
          })
          .toLowerCase()}_${startDate.getFullYear()}`,
      });
    }

    await browser.close();

    const reportData = results.map((result) => ({
      userId: result.userId,
      url: result.url,
      fileName: `duithive_monthlyreport_${startDate
        .toLocaleString("en-US", {
          month: "short",
        })
        .toLowerCase()}_${startDate.getFullYear()}`,
    }));

    await step.run("upload-user-report-db", async () => {
      await prisma.report.createMany({
        data: reportData,
      });
    });

    // For each result, send us an event.  Inngest supports batches of events
    // as long as the entire payload is less than 512KB.
    const events = results.map<Events["mailers/monthly-report-email.send"]>(
      (result) => {
        return {
          name: "mailers/monthly-report-email.send",
          data: {
            email: result.email,
            url: result.url,
          },
        };
      }
    );

    // Send all events to Inngest, which triggers any functions listening to
    // the given event names.
    await step.sendEvent("mailers/monthly-report-email.send", events);

    // Return the number of users triggered.
    return { count: results.length };
  }
);
