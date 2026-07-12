"use client";

import { useState, FormEvent } from "react";
import { KeyRound, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useApiKeys } from "@/hooks/use-api-keys";
import { api, APIError } from "@/lib/api";
import { PROVIDERS } from "@/lib/types";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { keys, refresh } = useApiKeys();
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest() {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        "/api/settings/test-connection",
        { provider, api_key: apiKey }
      );
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err instanceof APIError ? err.message : "Test failed." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/settings/api-key", { provider, api_key: apiKey });
      setApiKey("");
      setTestResult(null);
      refresh();
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Failed to save key.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Provider) {
    await api.delete(`/api/settings/api-key/${p}`);
    refresh();
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Connect your own AI provider API keys" />
      <main className="flex-1 p-6 md:p-8 max-w-2xl">
        <Card className="p-5 mb-6">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-signal" /> Add or update a key
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted mb-2 block">Provider</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PROVIDERS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => { setProvider(p.id); setTestResult(null); }}
                    className={cn(
                      "text-xs py-2 rounded-md border transition-colors font-medium",
                      provider === p.id
                        ? "bg-signal/10 border-signal text-signal"
                        : "border-canvas-border text-ink-muted hover:bg-canvas-surface"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">API key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                placeholder="Paste your API key"
              />
            </div>

            {testResult && (
              <div
                className={cn(
                  "flex items-center gap-2 text-xs rounded-md px-3 py-2",
                  testResult.success ? "bg-good/10 text-good" : "bg-bad/10 text-bad"
                )}
              >
                {testResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {testResult.message}
              </div>
            )}
            {error && <p className="text-xs text-bad">{error}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleTest} disabled={!apiKey.trim() || testing}>
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Test connection
              </Button>
              <Button type="submit" loading={saving} disabled={!apiKey.trim()}>
                Save key
              </Button>
            </div>
          </form>
        </Card>

        <div>
          <h2 className="font-display font-semibold text-sm mb-3">Connected providers</h2>
          <div className="space-y-2">
            {keys.length === 0 && (
              <p className="text-sm text-ink-muted">No API keys added yet.</p>
            )}
            {keys.map((k) => {
              const label = PROVIDERS.find((p) => p.id === k.provider)?.label || k.provider;
              return (
                <Card key={k.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-ink-faint font-mono mt-0.5">{k.masked_key}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(k.provider)}
                    className="text-ink-faint hover:text-bad transition-colors"
                    aria-label={`Remove ${label} key`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
