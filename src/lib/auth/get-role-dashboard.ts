import type { UserRole } from "@/types/database";
export function getRoleDashboard(role?: UserRole | null) {
  if (role === "SUPER_ADMIN") return "/super-admin/dashboard";
  if (role === "OPERATOR_ADMIN") return "/operator/dashboard";
  return "/my-bookings";
}
