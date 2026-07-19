import { apiError, apiSuccess } from "@/lib/api-response";
import { getCustomerApiProfile } from "@/lib/auth/api-guards";
import { createClient } from "@/lib/supabase/server";
import { bookingHoldSchema } from "@/validations/booking-hold";
export async function POST(request: Request) {
  const profile = await getCustomerApiProfile(); if (!profile) return apiError("CUSTOMER_REQUIRED", "Sign in with a customer account to continue.", 401);
  const parsed = bookingHoldSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check your booking details.", 400);
  const { productId, productType: _type, ...bookingRequest } = parsed.data; void _type;
  const { data, error } = await (await createClient()).rpc("create_booking_hold", { p_product_id: productId, p_request: bookingRequest });
  if (error) { const unavailable = error.message.includes("WORKSPACE_NOT_AVAILABLE"); return apiError(unavailable ? "WORKSPACE_NOT_AVAILABLE" : "HOLD_FAILED", unavailable ? "This workspace was just reserved. Choose another option." : "The booking hold could not be created.", unavailable ? 409 : 400); }
  return apiSuccess(data, 201);
}
