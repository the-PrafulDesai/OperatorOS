import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getDashboardData } from "@/lib/data/operators";
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return apiError("UNAUTHENTICATED", "Sign in to continue.", 401);
  if (!profile.is_active || profile.role !== "SUPER_ADMIN")
    return apiError(
      "UNAUTHORIZED",
      "You do not have access to this resource.",
      403,
    );
  try {
    return apiSuccess(await getDashboardData());
  } catch {
    return apiError("SERVER_ERROR", "Dashboard data could not be loaded.", 500);
  }
}
