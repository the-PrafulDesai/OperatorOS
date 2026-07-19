import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import { ensureEditable, getOperatorWorkspace, resetLocationReview } from "@/lib/data/phase2";
import { WORKSPACE_MEDIA_BUCKET } from "@/lib/media/workspace-media";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaUpdateSchema } from "@/validations/media";

export async function PATCH(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const auth = await getOperatorApiContext(); if (!auth) return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const workspace = await getOperatorWorkspace(auth.profile.id); const id = (await params).imageId; const image = workspace?.images.find((item) => item.id === id);
  if (!workspace || !image) return apiError("IMAGE_NOT_FOUND", "Location photo not found.", 404);
  if (!(await ensureEditable(workspace.location.id))) return apiError("LOCATION_IN_REVIEW", "Photos cannot be changed during review.", 409);
  const parsed = mediaUpdateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("INVALID_IMAGE", "Check the photo details.", 400);
  await resetLocationReview(workspace.location.id); const admin = createAdminClient();
  if (parsed.data.isCover) await admin.from("location_images").update({ is_cover: false }).eq("location_id", workspace.location.id);
  if (parsed.data.sortOrder !== undefined && parsed.data.sortOrder !== image.sort_order) {
    const swap = workspace.images.find((item) => item.sort_order === parsed.data.sortOrder);
    if (swap) await admin.from("location_images").update({ sort_order: image.sort_order }).eq("id", swap.id);
  }
  const { data, error } = await admin.from("location_images").update({ alt_text: parsed.data.altText, sort_order: parsed.data.sortOrder, is_cover: parsed.data.isCover }).eq("id", id).eq("location_id", workspace.location.id).select("*").single();
  if (error) return apiError("IMAGE_UPDATE_FAILED", "The photo could not be updated.", 500);
  if (data.is_cover) await admin.from("locations").update({ cover_image_path: data.storage_path }).eq("id", workspace.location.id);
  return apiSuccess(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const auth = await getOperatorApiContext(); if (!auth) return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const workspace = await getOperatorWorkspace(auth.profile.id); const id = (await params).imageId; const image = workspace?.images.find((item) => item.id === id);
  if (!workspace || !image) return apiError("IMAGE_NOT_FOUND", "Location photo not found.", 404);
  if (!(await ensureEditable(workspace.location.id))) return apiError("LOCATION_IN_REVIEW", "Photos cannot be changed during review.", 409);
  await resetLocationReview(workspace.location.id); const admin = createAdminClient(); const { error: storageError } = await admin.storage.from(WORKSPACE_MEDIA_BUCKET).remove([image.storage_path]);
  if (storageError) return apiError("IMAGE_DELETE_FAILED", "The stored photo could not be removed.", 500);
  await admin.from("location_images").delete().eq("id", id).eq("location_id", workspace.location.id);
  if (image.is_cover) { const next = workspace.images.find((item) => item.id !== id); if (next) { await admin.from("location_images").update({ is_cover: true }).eq("id", next.id); await admin.from("locations").update({ cover_image_path: next.storage_path }).eq("id", workspace.location.id); } else await admin.from("locations").update({ cover_image_path: null }).eq("id", workspace.location.id); }
  await admin.from("audit_logs").insert({ actor_user_id: auth.profile.id, action: "LOCATION_IMAGE_REMOVED", entity_type: "location", entity_id: workspace.location.id, metadata: {} });
  return apiSuccess({ deleted: true });
}
