import type { NextApiRequest, NextApiResponse } from "next";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { verifySignature } from "@upstash/qstash/nextjs";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const ctx = await createTRPCContext({ req, res });
//   const caller = appRouter.createCaller(ctx);

//   try {
//     const { id } = req.query;
//   } catch (err) {
//     if (err instanceof TRPCError) {
//       const httpCode = getHTTPStatusCodeFromError(cause);
//       return res.status(httpCode).json(cause);
//     }
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }

const checkBudgetExpiry = async (req: NextApiRequest, res: NextApiResponse) => {
  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);

  try {
    const data = await caller.budget.checkBudgetExpiry();
    return res.status(200).json(data);
  } catch (err) {
    if (err instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(err);
      return res.status(httpCode).json(err);
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default verifySignature(checkBudgetExpiry);

export const config = {
  api: {
    bodyParser: false,
  },
};
