import { z } from "zod";
export const requestChangesSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(15, "Explain the required changes in at least 15 characters.")
    .max(1500),
});
