import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOperatorWorkspace,
  resetLocationReview,
} from "@/lib/data/phase2";
import { isOwnedLocationPath } from "@/lib/media/workspace-media";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaCreateSchema } from "@/validations/media";
export async function POST(request: Request) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  if (!(await ensureEditable(auth.context.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Photos cannot be changed during review.",
      409,
    );
  const parsed = mediaCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (
    !parsed.success ||
    !isOwnedLocationPath(
      parsed.data?.storagePath ?? "",
      auth.context.operatorId,
      auth.context.location.id,
    )
  )
    return apiError(
      "INVALID_MEDIA_PATH",
      "The uploaded media path is not valid for this location.",
      400,
    );
  const workspace = await getOperatorWorkspace(auth.profile.id);
  if (!workspace)
    return apiError(
      "LOCATION_NOT_FOUND",
      "No assigned location was found.",
      404,
    );
  if (workspace.images.length >= 8)
    return apiError(
      "IMAGE_LIMIT_REACHED",
      "A location can have up to eight photos.",
      409,
    );
  await resetLocationReview(workspace.location.id);
  const admin = createAdminClient();
  if (parsed.data.isCover)
    await admin
      .from("location_images")
      .update({ is_cover: false })
      .eq("location_id", workspace.location.id);
  const { data, error } = await admin
    .from("location_images")
    .insert({
      location_id: workspace.location.id,
      storage_path: parsed.data.storagePath,
      alt_text: parsed.data.altText || null,
      is_cover: parsed.data.isCover || workspace.images.length === 0,
      sort_order: parsed.data.sortOrder,
    })
    .select("*")
    .single();
  if (error)
    return apiError(
      "IMAGE_SAVE_FAILED",
      "The photo metadata could not be saved.",
      500,
    );
  if (data.is_cover)
    await admin
      .from("locations")
      .update({ cover_image_path: data.storage_path })
      .eq("id", workspace.location.id);
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "LOCATION_IMAGE_ADDED",
      entity_type: "location",
      entity_id: workspace.location.id,
      metadata: {},
    });
  return apiSuccess(data, 201);
}
