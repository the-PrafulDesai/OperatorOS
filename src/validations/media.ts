import { z } from "zod";
export const mediaCreateSchema = z.object({
  storagePath: z.string().min(20).max(500),
  altText: z.string().trim().max(200).default(""),
  isCover: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(20).default(0),
});
export const mediaUpdateSchema = z.object({
  altText: z.string().trim().max(200).optional(),
  isCover: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(20).optional(),
});
