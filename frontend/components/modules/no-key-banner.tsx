import Link from "next/link";
import { KeyRound } from "lucide-react";
import type { Provider } from "@/lib/types";
import { PROVIDERS } from "@/lib/types";

export function NoKeyBanner({ provider }: { provider: Provider }) {
  const label = PROVIDERS.find((p) => p.id === provider)?.label || provider;
  return (
    <div className="flex items-center gap-3 rounded-md border border-amber/30 bg-amber/10 px-4 py-3 text-sm">
      <KeyRound className="h-4 w-4 text-amber shrink-0" />
      <span className="text-ink-muted">
        No {label} API key configured yet.{" "}
        <Link href="/dashboard/settings" className="text-amber font-medium hover:underline">
          Add one in Settings
        </Link>{" "}
        to use this module.
      </span>
    </div>
  );
}
