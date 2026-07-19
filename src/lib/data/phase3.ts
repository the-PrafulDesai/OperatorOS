import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getLocationWorkspace,
  getOperatorContext,
  getPlatformLocations,
} from "@/lib/data/phase2";
import type {
  BookingHold,
  BookingView,
  Notification,
  WorkspaceProductType,
} from "@/types/database";
import type { LocationWorkspace } from "@/types/database";
import type { AvailabilityInput } from "@/validations/availability";

const bookingSelect =
  "*,customer:profiles!bookings_customer_id_fkey(id,full_name,email,phone),operator:operators(id,company_name),location:locations(id,name,slug,city,address,cancellation_policy),product:workspace_products(id,name,slug,type),inventory:inventory_units(id,code,name),payment:payments(id,status,provider,provider_reference,paid_at,refunded_at)";

export async function getMarketplaceLocations(
  filters: { city?: string; category?: WorkspaceProductType; q?: string } = {},
) {
  const rows = await getPlatformLocations();
  const workspaces = (
    await Promise.all(
      rows
        .filter(
          ({ location }) =>
            location.status === "ACTIVE" &&
            location.review_status === "APPROVED" &&
            location.is_published,
        )
        .map(({ location }) => getLocationWorkspace(location.id)),
    )
  ).filter(Boolean);
  return workspaces
    .filter((workspace) => {
      if (!workspace) return false;
      const products = workspace.products.filter(
        (product) => product.status === "ACTIVE",
      );
      const text =
        `${workspace.location.name} ${workspace.location.city} ${workspace.location.description ?? ""}`.toLowerCase();
      return (
        (!filters.city ||
          workspace.location.city
            .toLowerCase()
            .includes(filters.city.toLowerCase())) &&
        (!filters.q || text.includes(filters.q.toLowerCase())) &&
        (!filters.category ||
          products.some((product) => product.type === filters.category))
      );
    })
    .map((workspace) =>
      publicWorkspace({
        ...workspace!,
        products: workspace!.products.filter(
          (product) => product.status === "ACTIVE",
        ),
      }),
    );
}

export async function getMarketplaceLocation(slug: string) {
  const { data } = await createAdminClient()
    .from("locations")
    .select("id")
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .eq("review_status", "APPROVED")
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  const workspace = await getLocationWorkspace(data.id);
  return workspace
    ? publicWorkspace({
        ...workspace,
        products: workspace.products.filter(
          (product) => product.status === "ACTIVE",
        ),
      })
    : null;
}

function publicWorkspace(workspace: LocationWorkspace): LocationWorkspace {
  const location = { ...workspace.location } as unknown as Record<
    string,
    unknown
  >;
  [
    "review_notes",
    "reviewed_by",
    "submitted_at",
    "reviewed_at",
    "created_by",
  ].forEach((key) => delete location[key]);
  const products = workspace.products.map((product) => {
    const safe = { ...product } as unknown as Record<string, unknown>;
    delete safe.created_by;
    safe.inventory = product.inventory.map((unit) => {
      const inventory = { ...unit } as unknown as Record<string, unknown>;
      delete inventory.metadata;
      return inventory;
    });
    return safe;
  });
  return {
    ...workspace,
    location,
    products,
    operator: workspace.operator
      ? {
          id: workspace.operator.id,
          company_name: workspace.operator.company_name,
          status: workspace.operator.status,
        }
      : null,
  } as unknown as LocationWorkspace;
}

export async function checkAvailability(input: AvailabilityInput) {
  const { productId, productType: _productType, ...request } = input;
  void _productType;
  const { data, error } = await createAdminClient().rpc(
    "validate_booking_request",
    { p_product_id: productId, p_request: request, p_ignore_hold: null },
  );
  if (error) {
    const unavailable = error.message.includes("WORKSPACE_NOT_AVAILABLE");
    throw new Error(
      unavailable ? "WORKSPACE_NOT_AVAILABLE" : "INVALID_BOOKING_REQUEST",
    );
  }
  const price = data as Record<string, unknown>;
  return {
    available: true,
    subtotal: Number(price.subtotal),
    taxAmount: Number(price.taxAmount),
    securityDeposit: Number(price.securityDeposit),
    totalAmount: Number(price.totalAmount),
    expiresInMinutes: 10,
  };
}

export async function getCustomerHold(
  userId: string,
  holdId: string,
): Promise<BookingHold | null> {
  const { data } = await createAdminClient()
    .from("booking_holds")
    .select("*")
    .eq("id", holdId)
    .eq("customer_id", userId)
    .maybeSingle();
  return data ? (normalizeMoney(data) as unknown as BookingHold) : null;
}

function normalizeMoney<T extends Record<string, unknown>>(row: T) {
  return {
    ...row,
    subtotal: Number(row.subtotal),
    tax_amount: Number(row.tax_amount),
    security_deposit: Number(row.security_deposit),
    platform_fee: Number(row.platform_fee),
    total_amount: Number(row.total_amount),
    operator_earnings: Number(row.operator_earnings),
  };
}

async function addHistory(
  rows: Record<string, unknown>[],
): Promise<BookingView[]> {
  if (!rows.length) return [];
  const { data: history } = await createAdminClient()
    .from("booking_status_history")
    .select("*")
    .in(
      "booking_id",
      rows.map((row) => row.id as string),
    )
    .order("created_at");
  return rows.map((row) => ({
    ...normalizeMoney(row),
    history: (history ?? []).filter((item) => item.booking_id === row.id),
  })) as unknown as BookingView[];
}

export async function getCustomerBookings(userId: string) {
  const { data, error } = await createAdminClient()
    .from("bookings")
    .select(bookingSelect)
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return addHistory((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function getCustomerBooking(userId: string, bookingId: string) {
  const rows = await getCustomerBookings(userId);
  return rows.find((item) => item.id === bookingId) ?? null;
}

export async function getOperatorBookings(userId: string) {
  const context = await getOperatorContext(userId);
  if (!context) return [];
  const { data, error } = await createAdminClient()
    .from("bookings")
    .select(bookingSelect)
    .eq("location_id", context.location.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return addHistory((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function getOperatorBooking(userId: string, bookingId: string) {
  const rows = await getOperatorBookings(userId);
  return rows.find((item) => item.id === bookingId) ?? null;
}

export async function getPlatformBookings() {
  const { data, error } = await createAdminClient()
    .from("bookings")
    .select(bookingSelect)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return addHistory((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function getPlatformBooking(bookingId: string) {
  const rows = await getPlatformBookings();
  return rows.find((item) => item.id === bookingId) ?? null;
}

export async function getNotifications(
  userId: string,
): Promise<Notification[]> {
  const { data, error } = await createAdminClient()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function getCustomers() {
  const admin = createAdminClient();
  const [{ data: profiles, error }, bookings] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,phone,created_at")
      .eq("role", "CUSTOMER")
      .order("created_at", { ascending: false }),
    getPlatformBookings(),
  ]);
  if (error) throw error;
  return (profiles ?? []).map((profile) => {
    const customerBookings = bookings.filter(
      (booking) => booking.customer_id === profile.id,
    );
    return {
      ...profile,
      totalBookings: customerBookings.length,
      confirmedBookings: customerBookings.filter(
        (b) => b.status === "CONFIRMED",
      ).length,
      completedBookings: customerBookings.filter(
        (b) => b.status === "COMPLETED",
      ).length,
      cancelledBookings: customerBookings.filter((b) =>
        ["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(b.status),
      ).length,
      totalSpend: customerBookings
        .filter((b) => ["SUCCESS", "REFUND_PENDING"].includes(b.payment_status))
        .reduce((sum, b) => sum + b.total_amount, 0),
    };
  });
}

export async function getBookingMetrics(bookings?: BookingView[]) {
  const rows = bookings ?? (await getPlatformBookings());
  const valueRows = rows.filter((b) => b.payment_status === "SUCCESS");
  return {
    totalBookings: rows.length,
    confirmedBookings: rows.filter((b) => b.status === "CONFIRMED").length,
    completedBookings: rows.filter((b) => b.status === "COMPLETED").length,
    cancelledBookings: rows.filter((b) =>
      ["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(b.status),
    ).length,
    checkedInBookings: rows.filter((b) => b.status === "CHECKED_IN").length,
    grossBookingValue: valueRows.reduce((sum, b) => sum + b.total_amount, 0),
    platformRevenue: valueRows.reduce((sum, b) => sum + b.platform_fee, 0),
    operatorEarnings: valueRows.reduce(
      (sum, b) => sum + b.operator_earnings,
      0,
    ),
    refundAmount: rows
      .filter((b) => b.payment_status === "REFUNDED")
      .reduce((sum, b) => sum + b.total_amount, 0),
  };
}
