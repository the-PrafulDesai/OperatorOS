import { z } from "zod";
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const scheduleDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    opensAt: time.nullable(),
    closesAt: time.nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.isOpen && (!day.opensAt || !day.closesAt))
      ctx.addIssue({
        code: "custom",
        message: "Open days require opening and closing times.",
      });
    if (
      day.isOpen &&
      day.opensAt &&
      day.closesAt &&
      day.closesAt <= day.opensAt
    )
      ctx.addIssue({
        code: "custom",
        message: "Closing time must be after opening time.",
      });
  });
export const operatingHoursSchema = z.object({
  days: z.array(scheduleDaySchema).length(7),
});
export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>;
