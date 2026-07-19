import { apiError, apiSuccess } from "@/lib/api-response";
import { checkAvailability } from "@/lib/data/phase3";
import { availabilitySchema } from "@/validations/availability";
export async function POST(request: Request) {
  const parsed = availabilitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check your booking details.", 400);
  try { return apiSuccess(await checkAvailability(parsed.data)); }
  catch (error) { const unavailable = error instanceof Error && error.message === "WORKSPACE_NOT_AVAILABLE"; return apiError(unavailable ? "WORKSPACE_NOT_AVAILABLE" : "INVALID_INPUT", unavailable ? "This workspace is no longer available for the selected time." : "Check your booking details.", unavailable ? 409 : 400); }
}
