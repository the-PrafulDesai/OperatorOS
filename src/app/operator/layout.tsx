import { OperatorShell } from "@/components/common/operator-shell";
import { requireRole } from "@/lib/auth/require-role";
export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("OPERATOR_ADMIN");
  return <OperatorShell profile={profile}>{children}</OperatorShell>;
}
