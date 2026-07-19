import Link from "next/link";
import {
  ArrowRight,
  Building2,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
  CalendarDays,
  IndianRupee,
  WalletCards,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDashboardData } from "@/lib/data/operators";
import { format } from "date-fns";
import { currency } from "@/lib/products/labels";

export const metadata = { title: "Dashboard | OperatorOS" };
export default async function DashboardPage() {
  const { metrics, recentOperators, recentBookings } = await getDashboardData();
  const cards = [
    {
      label: "Total operators",
      value: metrics.totalOperators,
      icon: Building2,
      note: "Across the platform",
    },
    { label: "Published locations", value: metrics.publishedLocations, icon: MapPin, note: "Live in marketplace" },
    { label: "Customers", value: metrics.totalCustomers, icon: Users, note: "Registered customer accounts" },
    { label: "Bookings", value: metrics.totalBookings, icon: CalendarDays, note: `${metrics.confirmedBookings} currently confirmed` },
    { label: "Platform revenue", value: currency(metrics.platformRevenue), icon: IndianRupee, note: `${currency(metrics.operatorEarnings)} operator earnings` },
    {
      label: "Active operators",
      value: metrics.activeOperators,
      icon: ShieldCheck,
      note: "Ready for access",
    },
    {
      label: "Total locations",
      value: metrics.totalLocations,
      icon: MapPin,
      note: "Including drafts",
    },
    {
      label: "Active operator admins",
      value: metrics.activeAdmins,
      icon: Users,
      note: "Enabled accounts",
    },
  ];
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Command centre"
        title="Good to see you."
        description="A live view of operator onboarding and platform readiness."
        actions={
          <Link
            href="/super-admin/operators/new"
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            <Plus />
            Create Operator
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Icon className="size-5" />
              </span>
            </div>
            <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
              {note}
            </p>
          </div>
        ))}
      </section>
      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="font-semibold">Recent bookings</h2><p className="mt-1 text-xs text-muted-foreground">Latest marketplace transactions and fulfilment state</p></div>{recentBookings.length>0&&<Link href="/super-admin/bookings" className={buttonVariants({variant:"ghost"})}>View all<ArrowRight/></Link>}</div>
        {recentBookings.length?<div className="divide-y">{recentBookings.map((booking)=><Link key={booking.id} href={`/super-admin/bookings/${booking.id}`} className="grid gap-3 px-6 py-4 transition hover:bg-muted/30 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center"><div><p className="font-medium">{booking.booking_reference}</p><p className="mt-1 text-xs text-muted-foreground">{booking.customer?.full_name} · {booking.product?.name}</p></div><p className="text-sm">{booking.location?.name}</p><div><p className="text-sm font-medium">{currency(booking.total_amount)}</p><p className="text-xs text-muted-foreground">Fee {currency(booking.platform_fee)}</p></div><StatusBadge status={booking.status}/></Link>)}</div>:<div className="p-10 text-center text-sm text-muted-foreground"><WalletCards className="mx-auto mb-3"/>No financial activity yet.</div>}
      </section>
      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold">Recently created operators</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The latest companies provisioned on OperatorOS
            </p>
          </div>
          {recentOperators.length > 0 && (
            <Link
              href="/super-admin/operators"
              className={buttonVariants({ variant: "ghost" })}
            >
              View all
              <ArrowRight />
            </Link>
          )}
        </div>
        {recentOperators.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <Building2 />
            </span>
            <h3 className="mt-4 font-semibold">Create your first operator</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Provision a company, administrator credentials, and an initial
              location in one guided flow.
            </p>
            <Link
              href="/super-admin/operators/new"
              className={cn(buttonVariants(), "mt-5")}
            >
              <Plus />
              Create Operator
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentOperators.map((operator) => (
              <Link
                key={operator.id}
                href={`/super-admin/operators/${operator.id}`}
                className="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center sm:px-6"
              >
                <div>
                  <p className="font-medium">{operator.company_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created{" "}
                    {format(new Date(operator.created_at), "d MMM yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Primary administrator
                  </p>
                  <p className="mt-1 text-sm">
                    {operator.primary_admin?.full_name ?? "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Initial location
                  </p>
                  <p className="mt-1 text-sm">
                    {operator.locations[0]
                      ? `${operator.locations[0].name}, ${operator.locations[0].city}`
                      : "Not assigned"}
                  </p>
                </div>
                <StatusBadge status={operator.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
