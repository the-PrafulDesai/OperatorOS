import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOwnedProduct,
  resetLocationReview,
} from "@/lib/data/phase2";
import { isOwnedProductPath } from "@/lib/media/workspace-media";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaCreateSchema } from "@/validations/media";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const owned = await getOwnedProduct(
    auth.profile.id,
    (await params).productId,
  );
  if (!owned)
    return apiError("PRODUCT_NOT_FOUND", "Workspace product not found.", 404);
  if (!(await ensureEditable(owned.workspace.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Product photos cannot be changed during review.",
      409,
    );
  const parsed = mediaCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (
    !parsed.success ||
    !isOwnedProductPath(
      parsed.data?.storagePath ?? "",
      owned.context.operatorId,
      owned.product.id,
    )
  )
    return apiError(
      "INVALID_MEDIA_PATH",
      "The uploaded media path is not valid for this product.",
      400,
    );
  if (owned.product.images.length >= 5)
    return apiError(
      "IMAGE_LIMIT_REACHED",
      "A product can have up to five photos.",
      409,
    );
  await resetLocationReview(owned.workspace.location.id);
  const admin = createAdminClient();
  if (parsed.data.isCover)
    await admin
      .from("product_images")
      .update({ is_cover: false })
      .eq("workspace_product_id", owned.product.id);
  const { data, error } = await admin
    .from("product_images")
    .insert({
      workspace_product_id: owned.product.id,
      storage_path: parsed.data.storagePath,
      alt_text: parsed.data.altText || null,
      is_cover: parsed.data.isCover || owned.product.images.length === 0,
      sort_order: parsed.data.sortOrder,
    })
    .select("*")
    .single();
  if (error)
    return apiError(
      "IMAGE_SAVE_FAILED",
      "The product photo could not be saved.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "PRODUCT_IMAGE_ADDED",
      entity_type: "workspace_product",
      entity_id: owned.product.id,
      metadata: {},
    });
  return apiSuccess(data, 201);
}
