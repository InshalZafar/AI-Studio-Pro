"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { MODULES, SETTINGS_MODULE } from "@/lib/modules";
import { EqBars } from "@/components/ui/eq-bars";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allItems = [...MODULES, SETTINGS_MODULE];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-canvas-border bg-canvas-raised h-screen sticky top-0">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-6 h-16 border-b border-canvas-border shrink-0">
        <EqBars className="text-signal" />
        <span className="font-display font-bold text-base tracking-tight">AI Studio</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {allItems.map((mod) => {
          const active = pathname.startsWith(mod.href);
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors group relative",
                active
                  ? "bg-signal/10 text-signal"
                  : "text-ink-muted hover:text-ink hover:bg-canvas-surface"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-signal rounded-full" />
              )}
              <mod.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 font-medium">{mod.name}</span>
              <span className="font-mono text-[10px] text-ink-faint group-hover:text-ink-muted">
                {mod.index}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-canvas-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div className="h-8 w-8 rounded-full bg-signal/15 text-signal flex items-center justify-center text-xs font-semibold shrink-0">
            {(user?.full_name || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || "Account"}</p>
            <p className="text-xs text-ink-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="h-7 w-7 flex items-center justify-center rounded-md text-ink-muted hover:text-bad hover:bg-bad/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
