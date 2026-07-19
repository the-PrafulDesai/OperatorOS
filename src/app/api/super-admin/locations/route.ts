import { apiError, apiSuccess } from "@/lib/api-response";
import { getSuperAdminApiProfile } from "@/lib/auth/api-guards";
import { getPlatformLocations } from "@/lib/data/phase2";
import { evaluateLocationCompletion } from "@/lib/completion/location-completion";
export async function GET() {
  if (!(await getSuperAdminApiProfile()))
    return apiError("UNAUTHORIZED", "Super Admin access is required.", 403);
  try {
    const rows = await getPlatformLocations();
    return apiSuccess(
      rows.map((row) => ({
        ...row,
        completion: row.workspace
          ? evaluateLocationCompletion(row.workspace)
          : null,
      })),
    );
  } catch {
    return apiError(
      "LOCATIONS_LOAD_FAILED",
      "Locations could not be loaded.",
      500,
    );
  }
}
