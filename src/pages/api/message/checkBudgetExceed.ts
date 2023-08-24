import type { NextApiRequest, NextApiResponse } from "next";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { verifySignature } from "@upstash/qstash/nextjs";

const checkBudgetExceed = async (req: NextApiRequest, res: NextApiResponse) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.log(req.body);

  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);

  try {
    const data = await caller.budget.checkBudgetExceed({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      budgetId: req.body.budgetId,
    });
    return res.status(200).json(data);
  } catch (err) {
    if (err instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(err);
      return res.status(httpCode).json(err);
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
  return res.status(200).json({ message: JSON.stringify(req.body) });
};

export default verifySignature(checkBudgetExceed);

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
