import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import {
  ensureEditable,
  getOperatorWorkspace,
  resetLocationReview,
} from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  productRow,
  scheduleRows,
  validateScheduleWithinLocation,
} from "@/lib/products/product-payload";
import { workspaceProductSchema } from "@/validations/workspace-product";
const slugify = (value: string) =>
  `${value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
export async function GET() {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const workspace = await getOperatorWorkspace(auth.profile.id);
  return workspace
    ? apiSuccess(workspace.products)
    : apiError("LOCATION_NOT_FOUND", "No assigned location was found.", 404);
}
export async function POST(request: Request) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  if (!(await ensureEditable(auth.context.location.id)))
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
  const workspace = await getOperatorWorkspace(auth.profile.id);
  if (!workspace)
    return apiError(
      "LOCATION_NOT_FOUND",
      "No assigned location was found.",
      404,
    );
  const scheduleIssues = validateScheduleWithinLocation(
    parsed.data,
    workspace.hours,
  );
  if (scheduleIssues.length)
    return apiError("INVALID_AVAILABILITY", scheduleIssues[0], 400);
  await resetLocationReview(workspace.location.id);
  const admin = createAdminClient();
  const { data: product, error } = await admin
    .from("workspace_products")
    .insert({
      ...productRow(parsed.data),
      location_id: workspace.location.id,
      created_by: auth.profile.id,
      slug: slugify(parsed.data.name),
      status: "DRAFT",
    })
    .select("*")
    .single();
  if (error)
    return apiError(
      "PRODUCT_CREATE_FAILED",
      "The workspace product could not be created.",
      500,
    );
  const { error: scheduleError } = await admin
    .from("availability_schedules")
    .insert(scheduleRows(parsed.data, product.id));
  if (scheduleError) {
    await admin.from("workspace_products").delete().eq("id", product.id);
    return apiError(
      "PRODUCT_CREATE_FAILED",
      "The availability schedule could not be saved.",
      500,
    );
  }
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "WORKSPACE_PRODUCT_CREATED",
      entity_type: "workspace_product",
      entity_id: product.id,
      metadata: { type: parsed.data.type },
    });
  return apiSuccess(
    { ...product, requestedStatus: parsed.data.desiredStatus },
    201,
  );
}
