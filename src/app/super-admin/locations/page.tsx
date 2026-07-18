import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { getOperators } from "@/lib/data/operators";
export const metadata = { title: "Locations | OperatorOS" };
export default async function LocationsPage() {
  const operators = await getOperators();
  const locations = operators.flatMap((operator) =>
    operator.locations.map((location) => ({
      ...location,
      company: operator.company_name,
    })),
  );
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Platform directory"
        title="Locations"
        description="Every operator location provisioned across the platform."
      />
      {locations.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <MapPin className="mx-auto text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No locations yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            An initial location will appear here when you create an operator.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <div key={location.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <MapPin className="size-5" />
                </span>
                <StatusBadge status={location.status} />
              </div>
              <h2 className="mt-5 font-semibold">{location.name}</h2>
              <p className="mt-1 text-sm text-primary">{location.company}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {location.address}, {location.city}
              </p>
              <div className="mt-4 border-t pt-3">
                <StatusBadge status={location.is_published} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
