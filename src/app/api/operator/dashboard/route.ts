import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import { getOperatorWorkspace } from "@/lib/data/phase2";
import { evaluateLocationCompletion } from "@/lib/completion/location-completion";
import { getBookingMetrics, getNotifications, getOperatorBookings } from "@/lib/data/phase3";
export async function GET() {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  const workspace = await getOperatorWorkspace(auth.profile.id);
  if (!workspace)
    return apiError(
      "ASSIGNMENT_NOT_FOUND",
      "No active location assignment was found.",
      404,
    );
  const completion = evaluateLocationCompletion(workspace);
  const inventoryCount = workspace.products.reduce(
    (sum, product) => sum + product.inventory.length,
    0,
  );
  const bookings = await getOperatorBookings(auth.profile.id);
  const bookingMetrics = await getBookingMetrics(bookings);
  const unreadNotifications = (await getNotifications(auth.profile.id)).filter((item) => !item.is_read).length;
  return apiSuccess({
    workspace,
    completion,
    metrics: {
      totalProducts: workspace.products.length,
      activeProducts: workspace.products.filter((p) => p.status === "ACTIVE")
        .length,
      draftProducts: workspace.products.filter((p) => p.status === "DRAFT")
        .length,
      inventoryCount,
      ...bookingMetrics,
      unreadNotifications,
    },
    recentBookings: bookings.slice(0, 5),
  });
}
