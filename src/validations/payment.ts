import { z } from "zod";
export const simulatedPaymentSchema = z.object({ holdId: z.string().uuid(), outcome: z.enum(["SUCCESS", "FAILED"]) });
