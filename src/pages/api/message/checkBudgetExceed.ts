import type { NextApiRequest, NextApiResponse } from "next";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { verifySignature } from "@upstash/qstash/nextjs";

const checkBudgetExceed = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('post requested')
      const ctx = await createTRPCContext({ req, res });
      const caller = appRouter.createCaller(ctx);

      const data = await caller.budget.checkBudgetExceed({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        budgetId: req.body,
      });
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (err) {
    if (err instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(err);
      return res.status(httpCode).json(err);
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default verifySignature(checkBudgetExceed);

export const config = {
  api: {
    bodyParser: false,
  },
};
