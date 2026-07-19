import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOwnedProduct,
  resetLocationReview,
} from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import { inventoryUpdateSchema } from "@/validations/inventory-unit";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string; unitId: string }> },
) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const ids = await params;
  const owned = await getOwnedProduct(auth.profile.id, ids.productId);
  if (
    !owned ||
    owned.product.type !== "DEDICATED_DESK" ||
    !owned.product.inventory.some((unit) => unit.id === ids.unitId)
  )
    return apiError("UNIT_NOT_FOUND", "Desk unit not found.", 404);
  if (!(await ensureEditable(owned.workspace.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Inventory cannot be changed during review.",
      409,
    );
  const parsed = inventoryUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_INVENTORY",
      parsed.error.issues[0]?.message ?? "Check the desk details.",
      400,
    );
  await resetLocationReview(owned.workspace.location.id);
  const { data, error } = await createAdminClient()
    .from("inventory_units")
    .update({
      name: parsed.data.name,
      status: parsed.data.status,
      available_from: parsed.data.availableFrom,
    })
    .eq("id", ids.unitId)
    .eq("workspace_product_id", ids.productId)
    .select("*")
    .single();
  return error
    ? apiError("UNIT_UPDATE_FAILED", "The desk could not be updated.", 500)
    : apiSuccess(data);
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ productId: string; unitId: string }> },
) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const ids = await params;
  const owned = await getOwnedProduct(auth.profile.id, ids.productId);
  if (!owned || !owned.product.inventory.some((unit) => unit.id === ids.unitId))
    return apiError("UNIT_NOT_FOUND", "Desk unit not found.", 404);
  if (!(await ensureEditable(owned.workspace.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Inventory cannot be changed during review.",
      409,
    );
  await resetLocationReview(owned.workspace.location.id);
  await createAdminClient()
    .from("inventory_units")
    .update({ status: "INACTIVE" })
    .eq("id", ids.unitId)
    .eq("workspace_product_id", ids.productId);
  return apiSuccess({ status: "INACTIVE" });
}
