"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import type { OperatorSummary, OperatorStatus } from "@/types/database";

export function OperatorsList({ operators }: { operators: OperatorSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | OperatorStatus>("ALL");
  const filtered = useMemo(
    () =>
      operators.filter((operator) => {
        const haystack = [
          operator.company_name,
          operator.primary_admin?.full_name,
          operator.primary_admin?.email,
          operator.primary_admin?.operator_code,
          ...operator.locations.flatMap((l) => [l.name, l.city]),
        ]
          .join(" ")
          .toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (status === "ALL" || operator.status === status)
        );
      }),
    [operators, query, status],
  );
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, admin, Operator ID, or city…"
            aria-label="Search operators"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/30"
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <Building2 className="mx-auto text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No operators found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or status filter.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Administrator</th>
                  <th className="px-5 py-3 font-medium">Initial location</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((operator) => (
                  <tr key={operator.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <Link
                        href={`/super-admin/operators/${operator.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {operator.company_name}
                      </Link>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {operator.primary_admin?.operator_code}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{operator.primary_admin?.full_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {operator.primary_admin?.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{operator.locations[0]?.name ?? "—"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {operator.locations[0]?.city}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={operator.status} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {format(new Date(operator.created_at), "d MMM yyyy")}
                    </td>
                    <td className="pr-4">
                      <Link
                        href={`/super-admin/operators/${operator.id}`}
                        aria-label={`View ${operator.company_name}`}
                      >
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y md:hidden">
            {filtered.map((operator) => (
              <Link
                key={operator.id}
                href={`/super-admin/operators/${operator.id}`}
                className="block p-4 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{operator.company_name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {operator.primary_admin?.operator_code}
                    </p>
                  </div>
                  <StatusBadge status={operator.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Administrator</p>
                    <p className="mt-1 text-foreground">
                      {operator.primary_admin?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="mt-1 text-foreground">
                      {operator.locations[0]?.city ?? "—"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
