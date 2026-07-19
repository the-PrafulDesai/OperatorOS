import { z } from "zod";

const date = z.string().date("Choose a valid date.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");
const productId = z.string().uuid();
export const availabilitySchema = z.discriminatedUnion("productType", [
  z.object({ productId, productType: z.literal("DAY_PASS"), bookingDate: date, quantity: z.coerce.number().int().min(1).max(100) }),
  z.object({ productId, productType: z.literal("MEETING_ROOM"), bookingDate: date, startTime: time, endTime: time, attendees: z.coerce.number().int().min(1).max(500) }),
  z.object({ productId, productType: z.literal("DEDICATED_DESK"), inventoryUnitId: z.string().uuid(), startDate: date, months: z.coerce.number().int().min(1).max(36) }),
  z.object({ productId, productType: z.literal("PRIVATE_CABIN"), startDate: date, months: z.coerce.number().int().min(1).max(36), teamSize: z.coerce.number().int().min(1).max(500) }),
]);
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
