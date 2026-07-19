import { redirect } from "next/navigation";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { Brand } from "@/components/common/brand";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getRoleDashboard } from "@/lib/auth/get-role-dashboard";

export const metadata = { title: "Sign in | OperatorOS" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const profile = await getCurrentProfile().catch(() => null);
  if (profile?.is_active) redirect(profile.role === "CUSTOMER" && next?.startsWith("/") && !next.startsWith("//") ? next : getRoleDashboard(profile.role));
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,#3b82f6_0,transparent_28%),radial-gradient(circle_at_80%_80%,#4f46e5_0,transparent_25%)]" />
        <Brand className="relative text-white" />
        <div className="relative my-auto max-w-xl">
          <p className="text-sm font-semibold tracking-widest text-blue-300 uppercase">
            Workspace operations
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">
            Every operator. Every location. One clear view.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            A secure operating layer for workspace companies and the teams who
            run them.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              [Building2, "Operators"],
              [MapPin, "Locations"],
              [CheckCircle2, "Readiness"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Building2;
              return (
                <div
                  key={label as string}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <I className="size-5 text-blue-300" />
                  <p className="mt-4 text-sm">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">
          OperatorOS · Secure access portal
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Brand className="mb-12 lg:hidden" />
          <p className="eyebrow mb-3">Welcome back</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Sign in to OperatorOS
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use your platform email or the Operator ID issued by your
            administrator.
          </p>
          <LoginForm next={next} />
        </div>
      </section>
    </main>
  );
}
