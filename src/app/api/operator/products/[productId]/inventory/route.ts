import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOwnedProduct,
  resetLocationReview,
} from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import { inventoryCreateSchema } from "@/validations/inventory-unit";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const owned = await getOwnedProduct(
    auth.profile.id,
    (await params).productId,
  );
  if (!owned || owned.product.type !== "DEDICATED_DESK")
    return apiError(
      "INVENTORY_NOT_AVAILABLE",
      "Desk inventory is available only for Dedicated Desk products.",
      404,
    );
  return apiSuccess(owned.product.inventory);
}
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
  if (!owned || owned.product.type !== "DEDICATED_DESK")
    return apiError(
      "INVENTORY_NOT_AVAILABLE",
      "Desk inventory is available only for Dedicated Desk products.",
      404,
    );
  if (!(await ensureEditable(owned.workspace.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Inventory cannot be changed during review.",
      409,
    );
  const parsed = inventoryCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_INVENTORY",
      parsed.error.issues[0]?.message ?? "Check the desk codes.",
      400,
    );
  const codes = [
    ...new Set(parsed.data.codes.map((code) => code.toUpperCase())),
  ];
  if (codes.length !== parsed.data.codes.length)
    return apiError(
      "DUPLICATE_DESK_CODE",
      "Remove duplicate desk codes and try again.",
      409,
    );
  const admin = createAdminClient();
  const { data: matches } = await admin
    .from("inventory_units")
    .select("code")
    .eq("workspace_product_id", owned.product.id)
    .in("code", codes);
  if (matches?.length)
    return apiError(
      "DUPLICATE_DESK_CODE",
      `Desk ${matches[0].code} already exists.`,
      409,
    );
  await resetLocationReview(owned.workspace.location.id);
  const { data, error } = await admin
    .from("inventory_units")
    .insert(
      codes.map((code) => ({
        workspace_product_id: owned.product.id,
        code,
        available_from:
          parsed.data.availableFrom ?? owned.product.available_from,
      })),
    )
    .select("*");
  if (error)
    return apiError(
      "INVENTORY_CREATE_FAILED",
      "The desk inventory could not be created.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "INVENTORY_UNITS_CREATED",
      entity_type: "workspace_product",
      entity_id: owned.product.id,
      metadata: { count: codes.length },
    });
  return apiSuccess(data, 201);
}
