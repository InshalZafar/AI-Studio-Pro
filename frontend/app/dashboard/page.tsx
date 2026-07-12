"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, KeyRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MODULES, SETTINGS_MODULE } from "@/lib/modules";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [query]);

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <>
      <Topbar title="Dashboard" subtitle="Choose a module to get started" />
      <main className="flex-1 p-6 md:p-8 max-w-6xl">
        <div className="mb-8 animate-fade-up">
          <p className="font-display text-2xl font-semibold mb-1">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </p>
          <p className="text-ink-muted text-sm">Six channels, each running on the provider you choose.</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules..."
            className="pl-9"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mod, i) => (
            <Link key={mod.id} href={mod.href} className="group">
              <Card
                className="p-5 h-full flex flex-col hover:border-signal/50 hover:bg-canvas-surface transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-md bg-signal/10 text-signal flex items-center justify-center">
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-[10px] text-ink-faint pt-1">{mod.index}</span>
                </div>
                <h3 className="font-display font-semibold text-sm mb-1 flex items-center gap-1.5">
                  {mod.name}
                  <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint opacity-0 group-hover:opacity-100 group-hover:text-signal transition-opacity" />
                </h3>
                <p className="text-xs text-signal-soft mb-2">{mod.tagline}</p>
                <p className="text-xs text-ink-muted leading-relaxed flex-1">{mod.description}</p>
              </Card>
            </Link>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-ink-muted col-span-full py-8 text-center">
              No modules match &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>

        <Link href={SETTINGS_MODULE.href}>
          <Card className="mt-4 p-5 flex items-center gap-4 hover:border-signal/50 hover:bg-canvas-surface transition-all duration-200 max-w-md">
            <div className="h-10 w-10 rounded-md bg-amber/10 text-amber flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-sm">{SETTINGS_MODULE.name}</h3>
              <p className="text-xs text-ink-muted">{SETTINGS_MODULE.description}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-ink-faint shrink-0" />
          </Card>
        </Link>
      </main>
    </>
  );
}
