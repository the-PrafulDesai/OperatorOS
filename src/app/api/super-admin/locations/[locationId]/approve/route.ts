import { apiError, apiSuccess } from "@/lib/api-response";
import { getSuperAdminApiProfile } from "@/lib/auth/api-guards";
import { getLocationWorkspace } from "@/lib/data/phase2";
import { evaluateLocationCompletion } from "@/lib/completion/location-completion";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(
  _: Request,
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
      "Only locations in review can be approved.",
      409,
    );
  const completion = evaluateLocationCompletion(workspace);
  if (!completion.canSubmit)
    return apiError(
      "LOCATION_INCOMPLETE",
      `Approval is blocked by ${completion.missing.map((item) => item.label.toLowerCase()).join(", ")}.`,
      409,
    );
  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin
    .from("locations")
    .update({
      review_status: "APPROVED",
      status: "ACTIVE",
      is_published: true,
      review_notes: null,
      reviewed_at: now,
      reviewed_by: actor.id,
      published_at: now,
    })
    .eq("id", id);
  if (error)
    return apiError(
      "APPROVAL_FAILED",
      "The location could not be published.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: actor.id,
      action: "LOCATION_APPROVED_AND_PUBLISHED",
      entity_type: "location",
      entity_id: id,
      metadata: {
        active_products: workspace.products.filter((p) => p.status === "ACTIVE")
          .length,
      },
    });
  return apiSuccess({
    reviewStatus: "APPROVED",
    isPublished: true,
    publishedAt: now,
  });
}
