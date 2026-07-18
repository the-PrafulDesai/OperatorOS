import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

export function StatusBadge({ status }: { status: string | boolean }) {
  const value =
    typeof status === "boolean"
      ? status
        ? "Published"
        : "Unpublished"
      : status.replaceAll("_", " ");
  const good = status === true || status === "ACTIVE";
  const caution =
    status === "DRAFT" || status === false || status === "SUSPENDED";
  return (
    <Badge
      variant="outline"
      className={
        good
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : caution
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      <Circle className="size-1.5 fill-current" />
      {value}
    </Badge>
  );
}
