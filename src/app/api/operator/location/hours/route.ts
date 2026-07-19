import { apiError, apiSuccess } from "@/lib/api-response";
import { getOperatorApiContext } from "@/lib/auth/api-guards";
import { ensureEditable, resetLocationReview } from "@/lib/data/phase2";
import { createAdminClient } from "@/lib/supabase/admin";
import { operatingHoursSchema } from "@/validations/operating-hours";
export async function PUT(request: Request) {
  const auth = await getOperatorApiContext();
  if (!auth)
    return apiError("UNAUTHORIZED", "Operator access is required.", 403);
  if (!(await ensureEditable(auth.context.location.id)))
    return apiError(
      "LOCATION_IN_REVIEW",
      "Editing is paused while this location is in review.",
      409,
    );
  const parsed = operatingHoursSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "INVALID_HOURS",
      parsed.error.issues[0]?.message ?? "Check the operating hours.",
      400,
    );
  await resetLocationReview(auth.context.location.id);
  const admin = createAdminClient();
  const rows = parsed.data.days.map((day) => ({
    location_id: auth.context.location.id,
    day_of_week: day.dayOfWeek,
    is_open: day.isOpen,
    opens_at: day.isOpen ? day.opensAt : null,
    closes_at: day.isOpen ? day.closesAt : null,
  }));
  const { data, error } = await admin
    .from("location_operating_hours")
    .upsert(rows, { onConflict: "location_id,day_of_week" })
    .select("*");
  if (error)
    return apiError(
      "HOURS_UPDATE_FAILED",
      "Operating hours could not be saved.",
      500,
    );
  await admin
    .from("audit_logs")
    .insert({
      actor_user_id: auth.profile.id,
      action: "LOCATION_HOURS_UPDATED",
      entity_type: "location",
      entity_id: auth.context.location.id,
      metadata: {},
    });
  return apiSuccess(data);
}
