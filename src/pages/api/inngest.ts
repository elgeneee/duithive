import { Inngest } from "inngest";
import { serve } from "inngest/next";
import { monthlyReportEmailJob } from "@/jobs/monthlyReportEmailJob";
import { sendMonthlyReportEmailJob } from "@/jobs/sendMonthlyReportEmailJob";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "duithive" });

// Create an API that serves zero functions
export default serve({
  client: inngest,
  functions: [monthlyReportEmailJob, sendMonthlyReportEmailJob],
});
