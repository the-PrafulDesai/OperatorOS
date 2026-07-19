import { cn } from "@/lib/utils";
export function CompletionProgress({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full",
        size === "sm" ? "size-12" : size === "lg" ? "size-28" : "size-20",
      )}
      style={{
        background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="absolute inset-[6px] grid place-items-center rounded-full bg-card">
        <span
          className={cn(
            "font-semibold tracking-tight",
            size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-lg",
          )}
        >
          {value}%
        </span>
      </div>
    </div>
  );
}
