import "server-only";
import { getCurrentProfile } from "./get-current-profile";
import { getOperatorContext } from "@/lib/data/phase2";
export async function getOperatorApiContext() {
  const profile = await getCurrentProfile();
  if (!profile?.is_active || profile.role !== "OPERATOR_ADMIN") return null;
  const context = await getOperatorContext(profile.id);
  return context ? { profile, context } : null;
}
export async function getSuperAdminApiProfile() {
  const profile = await getCurrentProfile();
  return profile?.is_active && profile.role === "SUPER_ADMIN" ? profile : null;
}
