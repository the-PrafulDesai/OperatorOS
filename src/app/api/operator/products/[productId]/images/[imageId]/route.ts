import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import { ensureEditable, getOwnedProduct, resetLocationReview } from "@/lib/data/phase2";
import { WORKSPACE_MEDIA_BUCKET } from "@/lib/media/workspace-media";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaUpdateSchema } from "@/validations/media";

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string; imageId: string }> }) {
  const auth = await getOperatorApiContext(); if (!auth) return apiError("UNAUTHORIZED", "Operator access is required.", 403); const ids = await params; const owned = await getOwnedProduct(auth.profile.id, ids.productId); const image = owned?.product.images.find((item) => item.id === ids.imageId);
  if (!owned || !image) return apiError("IMAGE_NOT_FOUND", "Product photo not found.", 404); if (!(await ensureEditable(owned.workspace.location.id))) return apiError("LOCATION_IN_REVIEW", "Product photos cannot be changed during review.", 409);
  const parsed = mediaUpdateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return apiError("INVALID_IMAGE", "Check the photo details.", 400); await resetLocationReview(owned.workspace.location.id); const admin = createAdminClient();
  if (parsed.data.isCover) await admin.from("product_images").update({ is_cover: false }).eq("workspace_product_id", owned.product.id);
  if (parsed.data.sortOrder !== undefined && parsed.data.sortOrder !== image.sort_order) { const swap = owned.product.images.find((item) => item.sort_order === parsed.data.sortOrder); if (swap) await admin.from("product_images").update({ sort_order: image.sort_order }).eq("id", swap.id); }
  const { data, error } = await admin.from("product_images").update({ alt_text: parsed.data.altText, sort_order: parsed.data.sortOrder, is_cover: parsed.data.isCover }).eq("id", ids.imageId).eq("workspace_product_id", owned.product.id).select("*").single();
  return error ? apiError("IMAGE_UPDATE_FAILED", "The product photo could not be updated.", 500) : apiSuccess(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ productId: string; imageId: string }> }) {
  const auth = await getOperatorApiContext(); if (!auth) return apiError("UNAUTHORIZED", "Operator access is required.", 403); const ids = await params; const owned = await getOwnedProduct(auth.profile.id, ids.productId); const image = owned?.product.images.find((item) => item.id === ids.imageId);
  if (!owned || !image) return apiError("IMAGE_NOT_FOUND", "Product photo not found.", 404); if (!(await ensureEditable(owned.workspace.location.id))) return apiError("LOCATION_IN_REVIEW", "Product photos cannot be changed during review.", 409);
  await resetLocationReview(owned.workspace.location.id); const admin = createAdminClient(); const { error } = await admin.storage.from(WORKSPACE_MEDIA_BUCKET).remove([image.storage_path]); if (error) return apiError("IMAGE_DELETE_FAILED", "The stored product photo could not be removed.", 500);
  await admin.from("product_images").delete().eq("id", ids.imageId).eq("workspace_product_id", ids.productId); if (image.is_cover) { const next = owned.product.images.find((item) => item.id !== ids.imageId); if (next) await admin.from("product_images").update({ is_cover: true }).eq("id", next.id); }
  await admin.from("audit_logs").insert({ actor_user_id: auth.profile.id, action: "PRODUCT_IMAGE_REMOVED", entity_type: "workspace_product", entity_id: owned.product.id, metadata: {} }); return apiSuccess({ deleted: true });
}
