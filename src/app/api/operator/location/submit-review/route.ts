import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import { getOperatorWorkspace } from "@/lib/data/phase2";
import { evaluateLocationCompletion } from "@/lib/completion/location-completion";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST() {
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
  if (workspace.location.review_status === "IN_REVIEW")
    return apiError(
      "ALREADY_IN_REVIEW",
      "This location is already being reviewed.",
      409,
    );
  const completion = evaluateLocationCompletion(workspace);
  if (!completion.canSubmit)
    return apiError(
      "LOCATION_INCOMPLETE",
      `Complete ${completion.missing.map((item) => item.label.toLowerCase()).join(", ")} before submitting.`,
      409,
    );
  const admin = createAdminClient();
  const submittedAt = new Date().toISOString();
  const { error } = await admin
    .from("locations")
    .update({
      review_status: "IN_REVIEW",
      submitted_at: submittedAt,
      review_notes: null,
      is_published: false,
    })
    .eq("id", workspace.location.id);
  if (error)
    return apiError(
      "SUBMIT_FAILED",
      "The location could not be submitted.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "LOCATION_SUBMITTED_FOR_REVIEW",
      entity_type: "location",
      entity_id: workspace.location.id,
      metadata: { completion: completion.percentage },
    });
  return apiSuccess({ reviewStatus: "IN_REVIEW", submittedAt, completion });
}
