import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  KeyRound,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getOperator } from "@/lib/data/operators";
export default async function OperatorDetailPage({
  params,
}: {
  params: Promise<{ operatorId: string }>;
}) {
  const operator = await getOperator((await params).operatorId);
  if (!operator) notFound();
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Operator profile"
        title={operator.company_name}
        description="Company, administrator, and assigned location information."
        actions={
          <>
            <Link
              href="/super-admin/operators"
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft />
              All operators
            </Link>
            <StatusBadge status={operator.status} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="surface-card p-6">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 />
          </span>
          <h2 className="mt-5 text-lg font-semibold">Company details</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-4">
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium text-right">
                {operator.company_name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                Created
              </dt>
              <dd>{format(new Date(operator.created_at), "d MMMM yyyy")}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Account status</dt>
              <dd>
                <StatusBadge status={operator.status} />
              </dd>
            </div>
          </dl>
        </section>
        <section className="surface-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
              <UserRound className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">
                Primary administrator
              </p>
              <h2 className="font-semibold">
                {operator.primary_admin?.full_name ?? "Not assigned"}
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                Email address
              </p>
              <p className="mt-2 break-all text-sm font-medium">
                {operator.primary_admin?.email}
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="size-3.5" />
                Operator ID
              </p>
              <p className="mt-2 font-mono text-sm font-semibold">
                {operator.primary_admin?.operator_code}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Passwords are securely managed by Supabase Auth and are never
            displayed here.
          </p>
        </section>
      </div>
      <section className="surface-card mt-6 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <MapPin className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Assigned locations</h2>
            <p className="text-xs text-muted-foreground">
              Phase 1 locations remain unpublished until setup is completed.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {operator.locations.map((location) => (
            <div key={location.id} className="rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{location.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {location.city}, {location.country}
                  </p>
                </div>
                <StatusBadge status={location.status} />
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {location.address}
                {location.state ? `, ${location.state}` : ""}{" "}
                {location.postal_code}
              </p>
              <div className="mt-4 border-t pt-3">
                <StatusBadge status={location.is_published} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
