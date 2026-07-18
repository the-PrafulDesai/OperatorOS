import { AppShell } from "@/components/common/app-shell";
import { requireRole } from "@/lib/auth/require-role";
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("SUPER_ADMIN");
  return <AppShell profile={profile}>{children}</AppShell>;
}
