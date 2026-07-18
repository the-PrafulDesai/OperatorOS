import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getRoleDashboard } from "@/lib/auth/get-role-dashboard";
export default async function UnauthorizedPage() {
  const profile = await getCurrentProfile().catch(() => null);
  const href = profile ? getRoleDashboard(profile.role) : "/login";
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="surface-card max-w-md p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Access is restricted</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This page is not available for your account. If you believe this is an
          error, contact your platform administrator.
        </p>
        <Link href={href} className={cn(buttonVariants(), "mt-6")}>
          {profile ? "Return to dashboard" : "Return to sign in"}
        </Link>
      </div>
    </main>
  );
}
