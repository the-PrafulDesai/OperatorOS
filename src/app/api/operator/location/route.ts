import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOperatorWorkspace,
  resetLocationReview,
} from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateLocationCompletion } from "@/lib/completion/location-completion";
import { locationProfileSchema } from "@/validations/location";
export async function GET() {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const workspace = await getOperatorWorkspace(auth.profile.id);
  if (!workspace)
    return apiError(
      "LOCATION_NOT_FOUND",
      "No assigned location was found.",
      404,
    );
  return apiSuccess({
    ...workspace,
    completion: evaluateLocationCompletion(workspace),
  });
}
export async function PATCH(request: Request) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  if (!(await ensureEditable(auth.context.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Editing is paused while this location is in review.",
      409,
    );
  const parsed = locationProfileSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message ?? "Check the location details.",
      400,
    );
  const input = parsed.data;
  await resetLocationReview(auth.context.location.id);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("locations")
    .update({
      name: input.name,
      description: input.description,
      address: input.address,
      city: input.city,
      state: input.state,
      postal_code: input.postalCode || null,
      country: input.country,
      phone: input.phone,
      email: input.email.toLowerCase(),
      timezone: input.timezone,
      amenities: input.amenities,
      parking_available: input.parkingAvailable,
      parking_information: input.parkingInformation || null,
      house_rules: input.houseRules,
      cancellation_policy: input.cancellationPolicy,
    })
    .eq("id", auth.context.location.id)
    .select("*")
    .single();
  if (error)
    return apiError(
      "LOCATION_UPDATE_FAILED",
      "The location could not be saved.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "LOCATION_PROFILE_UPDATED",
      entity_type: "location",
      entity_id: auth.context.location.id,
      metadata: { sections: ["profile", "amenities", "policies"] },
    });
  return apiSuccess(data);
}
