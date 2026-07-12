"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-canvas-border shrink-0 sticky top-0 bg-canvas/80 backdrop-blur z-10">
      <div>
        <h1 className="font-display font-semibold text-base leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="h-9 w-9 flex items-center justify-center rounded-md border border-canvas-border bg-canvas-surface text-ink-muted hover:text-ink transition-colors"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </header>
  );
}
