import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOwnedProduct,
  resetLocationReview,
} from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import { productReadiness } from "@/lib/completion/product-readiness";
import {
  productRow,
  proposedProduct,
  scheduleRows,
  validateScheduleWithinLocation,
} from "@/lib/products/product-payload";
import { workspaceProductSchema } from "@/validations/workspace-product";
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
  return owned
    ? apiSuccess(owned.product)
    : apiError("PRODUCT_NOT_FOUND", "Workspace product not found.", 404);
}
export async function PATCH(
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
      "Products cannot be changed while the location is in review.",
      409,
    );
  const parsed = workspaceProductSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_PRODUCT",
      parsed.error.issues[0]?.message ?? "Check the product details.",
      400,
    );
  if (parsed.data.type !== owned.product.type)
    return apiError(
      "TYPE_IMMUTABLE",
      "The product category cannot be changed.",
      400,
    );
  const scheduleIssues = validateScheduleWithinLocation(
    parsed.data,
    owned.workspace.hours,
  );
  if (scheduleIssues.length)
    return apiError("INVALID_AVAILABILITY", scheduleIssues[0], 400);
  const proposed = proposedProduct(parsed.data, owned.product);
  if (parsed.data.desiredStatus === "ACTIVE") {
    const readiness = productReadiness(proposed);
    if (!readiness.valid)
      return apiError(
        "PRODUCT_INCOMPLETE",
        `Add ${readiness.missing.join(", ")} before activating.`,
        409,
      );
  }
  await resetLocationReview(owned.workspace.location.id);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspace_products")
    .update({ ...productRow(parsed.data), status: parsed.data.desiredStatus })
    .eq("id", owned.product.id)
    .select("*")
    .single();
  if (error)
    return apiError(
      "PRODUCT_UPDATE_FAILED",
      "The workspace product could not be saved.",
      500,
    );
  await admin
    .from("availability_schedules")
    .upsert(scheduleRows(parsed.data, owned.product.id), {
      onConflict: "workspace_product_id,day_of_week",
    });
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action:
        parsed.data.desiredStatus === "ACTIVE"
          ? "WORKSPACE_PRODUCT_ACTIVATED"
          : "WORKSPACE_PRODUCT_UPDATED",
      entity_type: "workspace_product",
      entity_id: owned.product.id,
      metadata: { type: owned.product.type },
    });
  return apiSuccess(data);
}
export async function DELETE(
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
  if (!owned)
    return apiError("PRODUCT_NOT_FOUND", "Workspace product not found.", 404);
  if (!(await ensureEditable(owned.workspace.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Products cannot be changed while the location is in review.",
      409,
    );
  await resetLocationReview(owned.workspace.location.id);
  const admin = createAdminClient();
  await admin
    .from("workspace_products")
    .update({ status: "INACTIVE" })
    .eq("id", owned.product.id);
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "WORKSPACE_PRODUCT_DEACTIVATED",
      entity_type: "workspace_product",
      entity_id: owned.product.id,
      metadata: {},
    });
  return apiSuccess({ status: "INACTIVE" });
}
