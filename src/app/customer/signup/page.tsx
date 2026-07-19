import { redirect } from "next/navigation";
import { Brand } from "@/components/common/brand";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getRoleDashboard } from "@/lib/auth/get-role-dashboard";
export const metadata = { title: "Create customer account | OperatorOS" };
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams; const profile = await getCurrentProfile().catch(() => null);
  if (profile?.is_active) redirect(getRoleDashboard(profile.role));
  return <main className="min-h-screen bg-slate-50 px-5 py-10"><div className="mx-auto max-w-md"><Brand /><div className="surface-card mt-10 p-6 sm:p-8"><p className="eyebrow">Customer access</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Book a workspace</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Create your account to hold availability, complete a simulated payment, and manage bookings.</p><CustomerSignupForm next={next} /></div></div></main>;
}
