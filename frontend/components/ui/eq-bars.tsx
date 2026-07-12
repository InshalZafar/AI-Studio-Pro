import { cn } from "@/lib/utils";

export function EqBars({ className, active = true }: { className?: string; active?: boolean }) {
  return (
    <span className={cn("inline-flex items-end gap-[2px] h-3.5", className)}>
      <span
        className={cn(
          "w-[3px] bg-current rounded-full origin-bottom",
          active ? "animate-eq1" : "h-1"
        )}
        style={active ? { height: "100%" } : undefined}
      />
      <span
        className={cn(
          "w-[3px] bg-current rounded-full origin-bottom",
          active ? "animate-eq2" : "h-1.5"
        )}
        style={active ? { height: "100%" } : undefined}
      />
      <span
        className={cn(
          "w-[3px] bg-current rounded-full origin-bottom",
          active ? "animate-eq3" : "h-1"
        )}
        style={active ? { height: "100%" } : undefined}
      />
    </span>
  );
}
