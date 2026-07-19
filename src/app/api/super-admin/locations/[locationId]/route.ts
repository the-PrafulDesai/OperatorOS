import { apiError, apiSuccess } from "@/lib/api-response";
import { getSuperAdminApiProfile } from "@/lib/auth/api-guards";
import { getLocationWorkspace } from "@/lib/data/phase2";
import { evaluateLocationCompletion } from "@/lib/completion/location-completion";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ locationId: string }> },
) {
  if (!(await getSuperAdminApiProfile()))
    return apiError("UNAUTHORIZED", "Super Admin access is required.", 403);
  const id = (await params).locationId;
  const workspace = await getLocationWorkspace(id);
  if (!workspace)
    return apiError("LOCATION_NOT_FOUND", "Location not found.", 404);
  const { data: audit } = await createAdminClient()
    .from("audit_logs")
    .select("id,action,metadata,created_at,actor_user_id")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  return apiSuccess({
    workspace,
    completion: evaluateLocationCompletion(workspace),
    audit: audit ?? [],
  });
}
