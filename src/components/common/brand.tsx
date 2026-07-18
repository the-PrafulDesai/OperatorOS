import Link from "next/link";
import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Layers3 className="size-5" />
      </span>
      {!compact && (
        <span className="text-lg">
          Operator<span className="text-primary">OS</span>
        </span>
      )}
    </Link>
  );
}
