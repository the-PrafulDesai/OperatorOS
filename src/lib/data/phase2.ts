import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaPublicUrl } from "@/lib/media/workspace-media";
import type {
  LocationWorkspace,
  ManagedLocation,
  MediaImage,
  Profile,
  WorkspaceProduct,
} from "@/types/database";

export async function getOperatorContext(userId: string) {
  const admin = createAdminClient();
  const [{ data: member }, { data: assignment }] = await Promise.all([
    admin
      .from("operator_members")
      .select("operator_id,operators(id,company_name,status)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    admin
      .from("location_members")
      .select("location_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
  ]);
  if (!member || !assignment) return null;
  const { data: location, error } = await admin
    .from("locations")
    .select("*")
    .eq("id", assignment.location_id)
    .eq("operator_id", member.operator_id)
    .maybeSingle();
  if (error || !location) return null;
  return {
    userId,
    operatorId: member.operator_id as string,
    operator: member.operators as unknown as {
      id: string;
      company_name: string;
      status: string;
    },
    location: location as ManagedLocation,
  };
}

export async function getLocationWorkspace(
  locationId: string,
): Promise<LocationWorkspace | null> {
  const admin = createAdminClient();
  const [
    { data: location },
    { data: hours },
    { data: images },
    { data: products },
  ] = await Promise.all([
    admin
      .from("locations")
      .select("*,operator:operators(id,company_name,status)")
      .eq("id", locationId)
      .maybeSingle(),
    admin
      .from("location_operating_hours")
      .select("*")
      .eq("location_id", locationId)
      .order("day_of_week"),
    admin
      .from("location_images")
      .select("*")
      .eq("location_id", locationId)
      .order("sort_order"),
    admin
      .from("workspace_products")
      .select("*")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false }),
  ]);
  if (!location) return null;
  const productIds = (products ?? []).map((p) => p.id);
  const [{ data: productImages }, { data: availability }, { data: inventory }] =
    productIds.length
      ? await Promise.all([
          admin
            .from("product_images")
            .select("*")
            .in("workspace_product_id", productIds)
            .order("sort_order"),
          admin
            .from("availability_schedules")
            .select("*")
            .in("workspace_product_id", productIds)
            .order("day_of_week"),
          admin
            .from("inventory_units")
            .select("*")
            .in("workspace_product_id", productIds)
            .order("code"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];
  const mapImage = (image: Record<string, unknown>) =>
    ({
      ...image,
      public_url: mediaPublicUrl(image.storage_path as string),
    }) as MediaImage;
  const fullProducts = (products ?? []).map((product) => ({
    ...product,
    price: Number(product.price),
    security_deposit: Number(product.security_deposit),
    images: (productImages ?? [])
      .filter((i) => i.workspace_product_id === product.id)
      .map(mapImage),
    availability: (availability ?? []).filter(
      (a) => a.workspace_product_id === product.id,
    ),
    inventory: (inventory ?? []).filter(
      (i) => i.workspace_product_id === product.id,
    ),
  })) as WorkspaceProduct[];
  const { operator, ...locationFields } = location;
  return {
    location: locationFields as ManagedLocation,
    operator: operator as unknown as LocationWorkspace["operator"],
    hours: hours ?? [],
    images: (images ?? []).map(mapImage),
    products: fullProducts,
  };
}

export async function getOperatorWorkspace(userId: string) {
  const context = await getOperatorContext(userId);
  if (!context) return null;
  const workspace = await getLocationWorkspace(context.location.id);
  if (!workspace) return null;
  return { ...workspace, context };
}

export async function getOwnedProduct(userId: string, productId: string) {
  const context = await getOperatorContext(userId);
  if (!context) return null;
  const workspace = await getLocationWorkspace(context.location.id);
  if (!workspace) return null;
  const product = workspace.products.find((item) => item.id === productId);
  return product ? { context, workspace, product } : null;
}

export async function getPlatformLocations() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("locations")
    .select(
      "*,operator:operators(id,company_name,primary_admin:profiles!operators_primary_admin_user_id_fkey(id,full_name,email,operator_code))",
    )
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (row) => {
      const workspace = await getLocationWorkspace(row.id);
      const { operator, ...location } = row;
      return { location: location as ManagedLocation, operator, workspace };
    }),
  );
}

export async function getProfile(id: string) {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as Profile | null;
}

export async function resetLocationReview(locationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("locations")
    .select("review_status")
    .eq("id", locationId)
    .single();
  if (data?.review_status === "APPROVED")
    await admin
      .from("locations")
      .update({
        review_status: "DRAFT",
        is_published: false,
        submitted_at: null,
        reviewed_at: null,
        reviewed_by: null,
        published_at: null,
        review_notes: null,
      })
      .eq("id", locationId);
}

export async function ensureEditable(locationId: string) {
  const { data } = await createAdminClient()
    .from("locations")
    .select("review_status")
    .eq("id", locationId)
    .single();
  return data?.review_status !== "IN_REVIEW";
}
