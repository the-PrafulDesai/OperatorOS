import { apiError, apiSuccess } from "@/lib/api-response";
import { getCustomerApiProfile } from "@/lib/auth/api-guards";
import { getCustomerHold } from "@/lib/data/phase3";
import { createClient } from "@/lib/supabase/server";
export async function GET(_request: Request, { params }: { params: Promise<{ holdId: string }> }) {
  const profile = await getCustomerApiProfile(); if (!profile) return apiError("UNAUTHENTICATED", "Sign in to continue.", 401);
  const data = await getCustomerHold(profile.id, (await params).holdId); return data ? apiSuccess(data) : apiError("NOT_FOUND", "This hold is not available.", 404);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ holdId: string }> }) {
  const profile = await getCustomerApiProfile(); if (!profile) return apiError("UNAUTHENTICATED", "Sign in to continue.", 401);
  const { data, error } = await (await createClient()).rpc("release_booking_hold", { p_hold_id: (await params).holdId });
  return error ? apiError("HOLD_NOT_AVAILABLE", "This hold is no longer active.", 409) : apiSuccess(data);
}
