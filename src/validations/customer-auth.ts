import { z } from "zod";
export const customerSignupSchema = z.object({ fullName: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email(), phone: z.string().trim().min(7).max(20).optional().or(z.literal("")), password: z.string().min(8).max(72), next: z.string().optional() });
export function safeInternalPath(value?: string | null, fallback = "/my-bookings") { return value?.startsWith("/") && !value.startsWith("//") ? value : fallback; }
