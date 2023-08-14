import { z } from "zod";

export const reportSchema = z.object({
  fileName: z.string(),
  url: z.string(),
});
