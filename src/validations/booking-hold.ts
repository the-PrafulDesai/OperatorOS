import { z } from "zod";
import { availabilitySchema } from "./availability";
export const bookingHoldSchema = availabilitySchema;
export const holdIdSchema = z.object({ holdId: z.string().uuid() });
