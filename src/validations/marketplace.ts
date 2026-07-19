import { z } from "zod";
export const marketplaceQuerySchema = z.object({ city: z.string().trim().max(100).optional(), category: z.enum(["DAY_PASS", "MEETING_ROOM", "DEDICATED_DESK", "PRIVATE_CABIN"]).optional(), q: z.string().trim().max(100).optional() });
