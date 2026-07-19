import { apiError, apiSuccess } from "@/lib/api-response";
import { getSuperAdminApiProfile } from "@/lib/auth/api-guards";
import { getLocationWorkspace } from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestChangesSchema } from "@/validations/review";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const actor = await getSuperAdminApiProfile();
  if (!actor)
    return apiError("UNAUTHORIZED", "Super Admin access is required.", 403);
  const id = (await params).locationId;
  const workspace = await getLocationWorkspace(id);
  if (!workspace)
    return apiError("LOCATION_NOT_FOUND", "Location not found.", 404);
  if (workspace.location.review_status !== "IN_REVIEW")
    return apiError(
      "INVALID_REVIEW_STATE",
      "Changes can be requested only while a location is in review.",
      409,
    );
  const parsed = requestChangesSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_REASON",
      parsed.error.issues[0]?.message ?? "Add a clear reason.",
      400,
    );
  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin
    .from("locations")
    .update({
      review_status: "CHANGES_REQUESTED",
      is_published: false,
      review_notes: parsed.data.reason,
      reviewed_at: now,
      reviewed_by: actor.id,
    })
    .eq("id", id);
  if (error)
    return apiError(
      "REVIEW_UPDATE_FAILED",
      "The review decision could not be saved.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: actor.id,
      action: "LOCATION_CHANGES_REQUESTED",
      entity_type: "location",
      entity_id: id,
      metadata: { reason_length: parsed.data.reason.length },
    });
  return apiSuccess({
    reviewStatus: "CHANGES_REQUESTED",
    reviewNotes: parsed.data.reason,
    reviewedAt: now,
  });
}
