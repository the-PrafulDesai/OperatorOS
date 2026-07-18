import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getOperatorDashboard } from "@/lib/data/operators";
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return apiError("UNAUTHENTICATED", "Sign in to continue.", 401);
  if (!profile.is_active || profile.role !== "OPERATOR_ADMIN")
    return apiError(
      "UNAUTHORIZED",
      "You do not have access to this resource.",
      403,
    );
  const data = await getOperatorDashboard(profile.id);
  return data
    ? apiSuccess(data)
    : apiError(
        "ASSIGNMENT_NOT_FOUND",
        "No active operator assignment was found.",
        404,
      );
}
