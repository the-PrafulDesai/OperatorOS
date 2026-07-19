import { z } from "zod";
export const inventoryCreateSchema = z.object({
  codes: z
    .array(
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9][A-Z0-9_-]{0,30}$/),
    )
    .min(1)
    .max(100),
  availableFrom: z.string().date().nullable().optional(),
});
export const inventoryUpdateSchema = z.object({
  name: z.string().trim().max(100).nullable().optional(),
  status: z.enum(["AVAILABLE", "BLOCKED", "INACTIVE"]).optional(),
  availableFrom: z.string().date().nullable().optional(),
});
