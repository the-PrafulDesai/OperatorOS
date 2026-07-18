import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  DoorOpen,
  Users,
} from "lucide-react";
import { Brand } from "@/components/common/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getRoleDashboard } from "@/lib/auth/get-role-dashboard";

const categories = [
  { name: "Day Pass", icon: CalendarDays },
  { name: "Meeting Room", icon: Users },
  { name: "Dedicated Desk", icon: Building2 },
  { name: "Private Cabin", icon: DoorOpen },
];

export default async function Home() {
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    /* Setup may not be complete yet. */
  }
  const href = profile ? getRoleDashboard(profile.role) : "/login";
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <Link href={href} className={buttonVariants({ size: "lg" })}>
          {profile ? "Open dashboard" : "Sign in"}
          <ArrowRight />
        </Link>
      </header>
      <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="eyebrow mb-5">Workspace operations, unified</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">
            The operating system for modern workspaces.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            OperatorOS brings operator provisioning, location operations,
            inventory, and bookings into one calm, connected platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={href}
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              {profile ? "Go to dashboard" : "Access OperatorOS"}
              <ArrowRight />
            </Link>
            <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-3" />
              </span>
              Phase 1 foundation is ready
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <div className="surface-card overflow-hidden p-2">
            <div className="rounded-xl bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-sm text-slate-400">
                Built for every way people work
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                One platform. Four workspace categories.
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {categories.map(({ name, icon: Icon }) => (
                  <div
                    key={name}
                    className="rounded-xl border border-white/10 bg-white/[0.06] p-4"
                  >
                    <Icon className="size-5 text-blue-300" />
                    <p className="mt-5 text-sm font-medium">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t bg-white/70 px-5 py-6 text-center text-sm text-muted-foreground">
        The customer marketplace and booking journey arrive in Phase 3.
      </footer>
    </main>
  );
}
