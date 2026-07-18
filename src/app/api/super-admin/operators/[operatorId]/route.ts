import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getOperator } from "@/lib/data/operators";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ operatorId: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile?.is_active || profile.role !== "SUPER_ADMIN")
    return apiError(
      "UNAUTHORIZED",
      "You do not have access to this resource.",
      403,
    );
  const operator = await getOperator((await params).operatorId);
  return operator
    ? apiSuccess(operator)
    : apiError("NOT_FOUND", "Operator not found.", 404);
}
