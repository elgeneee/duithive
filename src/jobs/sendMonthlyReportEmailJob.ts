import { Inngest } from "inngest";
import { monthlyReportTemplate } from "@/store/monthly-report";
import nodemailer from "nodemailer";

const inngest = new Inngest({ id: "duithive" });

const transporter = nodemailer.createTransport({
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendMonthlyReportEmailJob = inngest.createFunction(
  { id: "send-monthly-report-email" },
  { event: "mailers/monthly-report-email.send" },
  async ({ event, step }) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);

    const emailSubject = `[DuitHive] Monthly Spending Recap: ${startDate.toLocaleString(
      "en-US",
      { month: "short" }
    )} ${startDate.getFullYear()}`;

    const options = {
      from: process.env.NODEMAILER_EMAIL,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      to: event?.data?.email as string,
      subject: emailSubject,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      html: monthlyReportTemplate(event?.data?.url as string),
    };

    await step.run("send-monthly-report-email", async () => {
      await transporter.sendMail(options);
    });

    return event;
  }
);
