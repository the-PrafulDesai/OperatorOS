import { apiError, apiSuccess } from "@/lib/api-response";
import { getCustomerApiProfile } from "@/lib/auth/api-guards";
import { createClient } from "@/lib/supabase/server";
import { simulatedPaymentSchema } from "@/validations/payment";
export async function POST(request: Request) {
  const profile = await getCustomerApiProfile(); if (!profile) return apiError("UNAUTHENTICATED", "Sign in to continue.", 401);
  const parsed = simulatedPaymentSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("INVALID_INPUT", "Choose a payment outcome.", 400);
  const supabase = await createClient();
  if (parsed.data.outcome === "FAILED") { const { error } = await supabase.rpc("release_booking_hold", { p_hold_id: parsed.data.holdId }); return error ? apiError("HOLD_NOT_AVAILABLE", "This hold is no longer active.", 409) : apiSuccess({ outcome: "FAILED", released: true }); }
  const { data, error } = await supabase.rpc("confirm_simulated_booking", { p_hold_id: parsed.data.holdId });
  if (error) { const expired = error.message.includes("HOLD_EXPIRED"); return apiError(expired ? "HOLD_EXPIRED" : "PAYMENT_FAILED", expired ? "Your hold expired. Return to the workspace to choose again." : "The simulated payment could not be completed.", expired ? 410 : 409); }
  return apiSuccess({ outcome: "SUCCESS", booking: data });
}
