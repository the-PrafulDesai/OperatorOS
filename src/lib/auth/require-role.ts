import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";
import { getRoleDashboard } from "./get-role-dashboard";
import { requireUser } from "./require-user";
export async function requireRole(role: UserRole) {
  const profile = await requireUser();
  if (profile.role !== role) redirect(getRoleDashboard(profile.role));
  return profile;
}
