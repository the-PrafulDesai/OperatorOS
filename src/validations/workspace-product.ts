import { z } from "zod";
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const scheduleDay = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isAvailable: z.boolean(),
  opensAt: time.nullable(),
  closesAt: time.nullable(),
}).superRefine((day, context) => {
  if (day.isAvailable && (!day.opensAt || !day.closesAt)) context.addIssue({ code: "custom", message: "Available days require opening and closing times." });
  if (day.isAvailable && day.opensAt && day.closesAt && day.closesAt <= day.opensAt) context.addIssue({ code: "custom", message: "Closing time must be after opening time." });
});
const schedule = z.array(scheduleDay).length(7);
const common = {
  name: z.string().trim().min(2).max(120),
  description: z
    .string()
    .trim()
    .min(30, "Add a description of at least 30 characters.")
    .max(2000),
  amenities: z.array(z.string()).max(30),
  schedule,
  desiredStatus: z.enum(["DRAFT", "ACTIVE"]),
};
export const dayPassSchema = z.object({
  ...common,
  type: z.literal("DAY_PASS"),
  price: z.coerce.number().positive(),
  capacity: z.coerce.number().int().positive(),
  maximumBookingQuantity: z.coerce.number().int().positive(),
  sameDayBookingAllowed: z.boolean(),
  autoAssignSeat: z.boolean(),
});
export const meetingRoomSchema = z.object({
  ...common,
  type: z.literal("MEETING_ROOM"),
  price: z.coerce.number().positive(),
  capacity: z.coerce.number().int().positive(),
  minimumBookingMinutes: z.coerce.number().int().positive(),
  slotIntervalMinutes: z.coerce.number().int().min(15).max(240),
  bufferMinutes: z.coerce.number().int().min(0).max(240),
});
export const dedicatedDeskSchema = z.object({
  ...common,
  type: z.literal("DEDICATED_DESK"),
  price: z.coerce.number().positive(),
  capacity: z.coerce.number().int().positive(),
  minimumTenureMonths: z.coerce.number().int().positive(),
  securityDeposit: z.coerce.number().min(0),
  availableFrom: z.string().date(),
  zone: z.string().trim().max(100),
});
export const privateCabinSchema = z.object({
  ...common,
  type: z.literal("PRIVATE_CABIN"),
  price: z.coerce.number().positive(),
  capacity: z.coerce.number().int().positive(),
  minimumTenureMonths: z.coerce.number().int().positive(),
  securityDeposit: z.coerce.number().min(0),
  availableFrom: z.string().date(),
});
export const workspaceProductSchema = z.discriminatedUnion("type", [
  dayPassSchema,
  meetingRoomSchema,
  dedicatedDeskSchema,
  privateCabinSchema,
]);
export type WorkspaceProductInput = z.infer<typeof workspaceProductSchema>;
