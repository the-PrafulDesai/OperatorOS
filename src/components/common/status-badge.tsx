import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

export function StatusBadge({ status }: { status: string | boolean }) {
  const labels: Record<string, string> = {
    ACTIVE: "Active", DRAFT: "Draft", INACTIVE: "Inactive", SUSPENDED: "Suspended",
    IN_REVIEW: "In review", CHANGES_REQUESTED: "Changes requested", APPROVED: "Approved",
    AVAILABLE: "Available", BLOCKED: "Blocked",
    CONVERTED: "Converted", EXPIRED: "Expired", RELEASED: "Released",
    PAYMENT_PENDING: "Payment pending", CONFIRMED: "Confirmed", CHECKED_IN: "Checked in",
    COMPLETED: "Completed", CANCELLED: "Cancelled", REFUND_PENDING: "Refund pending",
    REFUNDED: "Refunded", NO_SHOW: "No-show", PENDING: "Pending", SUCCESS: "Paid", FAILED: "Failed",
  };
  const value =
    typeof status === "boolean"
      ? status
        ? "Published"
        : "Unpublished"
      : labels[status] ?? status.replaceAll("_", " ");
  const good = status === true || status === "ACTIVE" || status === "APPROVED" || status === "AVAILABLE" || status === "CONFIRMED" || status === "COMPLETED" || status === "SUCCESS";
  const info = status === "IN_REVIEW" || status === "CHECKED_IN";
  const caution =
    status === "DRAFT" || status === false || status === "SUSPENDED";
  return (
    <Badge
      variant="outline"
      className={
        good
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : info
            ? "border-blue-200 bg-blue-50 text-blue-700"
          : caution || status === "CHANGES_REQUESTED" || status === "BLOCKED"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      <Circle className="size-1.5 fill-current" />
      {value}
    </Badge>
  );
}
