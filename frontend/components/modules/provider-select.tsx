"use client";

import { PROVIDERS, Provider } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function ProviderSelect({
  value,
  onChange,
  className,
}: {
  value: Provider;
  onChange: (p: Provider) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Provider)}
        className="appearance-none w-full rounded-md bg-canvas-surface border border-canvas-border pl-3 pr-8 py-2 text-xs font-medium text-ink outline-none focus:border-signal focus:ring-1 focus:ring-signal/40 cursor-pointer"
      >
        {PROVIDERS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint pointer-events-none" />
    </div>
  );
}
