import { z } from "zod";
export const bookingStatusSchema = z.object({ status: z.enum(["CHECKED_IN", "COMPLETED", "NO_SHOW"]), reason: z.string().trim().max(500).optional() }).superRefine((value, context) => {
  if (value.status === "NO_SHOW" && (!value.reason || value.reason.length < 3)) context.addIssue({ code: "custom", path: ["reason"], message: "Add a short no-show reason." });
});
