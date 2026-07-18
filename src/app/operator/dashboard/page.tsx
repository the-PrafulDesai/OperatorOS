import {
  Building2,
  CheckCircle2,
  Compass,
  MapPin,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { requireRole } from "@/lib/auth/require-role";
import { getOperatorDashboard } from "@/lib/data/operators";
export const metadata = { title: "Operator Dashboard | OperatorOS" };
export default async function OperatorDashboardPage() {
  const profile = await requireRole("OPERATOR_ADMIN");
  const data = await getOperatorDashboard(profile.id);
  const location = data?.locations[0] as
    | {
        name: string;
        city: string;
        address: string;
        state: string | null;
        postal_code: string | null;
        country: string;
        status: string;
        is_published: boolean;
      }
    | undefined;
  if (!data?.operator)
    return (
      <div className="page-container">
        <div className="surface-card p-10 text-center">
          <Compass className="mx-auto text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Assignment pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact your platform administrator to complete your operator
            assignment.
          </p>
        </div>
      </div>
    );
  return (
    <main className="page-container">
      <PageHeader
        eyebrow="Operator workspace"
        title={`Welcome, ${profile.full_name.split(" ")[0]}.`}
        description="Your OperatorOS account is ready. Here is the workspace currently assigned to you."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="surface-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 />
            </span>
            <StatusBadge status={data.operator.status} />
          </div>
          <p className="mt-6 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Operator company
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {data.operator.company_name}
          </h2>
          <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Operator ID</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {profile.operator_code}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account access</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="size-4 text-emerald-600" />
                Active and secure
              </p>
            </div>
          </div>
        </section>
        <section className="surface-card p-6">
          <div className="flex items-start justify-between">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <MapPin />
            </span>
            {location && <StatusBadge status={location.status} />}
          </div>
          <p className="mt-6 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Assigned location
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {location?.name ?? "Assignment pending"}
          </h2>
          {location && (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {location.address}, {location.city}
                {location.state ? `, ${location.state}` : ""}{" "}
                {location.postal_code}
              </p>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  Marketplace visibility
                </span>
                <StatusBadge status={location.is_published} />
              </div>
            </>
          )}
        </section>
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
            <Rocket />
          </span>
          <div>
            <p className="text-sm font-semibold text-blue-300">
              Next up · Phase 2
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Complete your location and launch inventory.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              You will be able to add photos, operating details, Day Passes,
              Meeting Rooms, Dedicated Desks, and Private Cabins.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Foundation ready
          </div>
        </div>
      </section>
    </main>
  );
}
