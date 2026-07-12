"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { Upload, Table2, Trash2, Send, Database } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProviderSelect } from "@/components/modules/provider-select";
import { NoKeyBanner } from "@/components/modules/no-key-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { EqBars } from "@/components/ui/eq-bars";
import { ChartRenderer } from "@/components/modules/chart-renderer";
import { useApiKeys } from "@/hooks/use-api-keys";
import { api, APIError } from "@/lib/api";
import type { CSVProjectItem, ChartSpec, Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QAEntry {
  question: string;
  answer: string;
  sql: string | null;
  resultPreview: Record<string, unknown>[] | null;
  chart: ChartSpec | null;
}

export default function CSVAIPage() {
  const { hasKey, loading: keysLoading } = useApiKeys();
  const [projects, setProjects] = useState<CSVProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [question, setQuestion] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<QAEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProjects() {
    const data = await api.get<CSVProjectItem[]>("/api/csv");
    setProjects(data);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      form.append("name", projectName.trim() || "Untitled Project");
      const project = await api.post<CSVProjectItem>("/api/csv/upload", form);
      setProjectName("");
      await loadProjects();
      setActiveProject(project.id);
      setHistory([]);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/csv/${id}`);
    if (activeProject === id) {
      setActiveProject(null);
      setHistory([]);
    }
    loadProjects();
  }

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || !activeProject || asking) return;
    setAsking(true);
    setError(null);
    const q = question.trim();
    setQuestion("");
    try {
      const res = await api.post<{
        answer: string;
        sql: string | null;
        result_preview: Record<string, unknown>[] | null;
        chart: ChartSpec | null;
      }>("/api/csv/chat", { project_id: activeProject, question: q, provider });
      setHistory((prev) => [
        ...prev,
        { question: q, answer: res.answer, sql: res.sql, resultPreview: res.result_preview, chart: res.chart },
      ]);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Something went wrong.");
    } finally {
      setAsking(false);
    }
  }

  const showBanner = !keysLoading && !hasKey(provider);
  const activeProjectData = projects.find((p) => p.id === activeProject);
  const tableNames: string[] = activeProjectData?.table_names ? JSON.parse(activeProjectData.table_names) : [];

  return (
    <>
      <Topbar title="CSV Analytics AI" subtitle="Ask your data in plain English" />
      <div className="flex-1 flex min-h-0">
        <div className="w-80 shrink-0 border-r border-canvas-border flex flex-col">
          <div className="p-4 border-b border-canvas-border space-y-2">
            <Input
              placeholder="Project name (optional)"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" /> Upload CSV files
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {projects.map((p) => (
              <Card
                key={p.id}
                onClick={() => { setActiveProject(p.id); setHistory([]); }}
                className={cn(
                  "p-3 cursor-pointer flex items-start gap-2.5",
                  activeProject === p.id ? "border-signal bg-signal/5" : "hover:bg-canvas-surface"
                )}
              >
                <Table2 className={cn("h-4 w-4 mt-0.5 shrink-0", activeProject === p.id ? "text-signal" : "text-ink-muted")} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-ink-faint mt-0.5">
                    {p.table_names ? JSON.parse(p.table_names).length : 0} table(s)
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                  className="text-ink-faint hover:text-bad shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Card>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-ink-faint text-center py-6">No CSV projects yet</p>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Database}
                title="Analyze your data"
                description={activeProject ? `Ask a question about: ${tableNames.join(", ")}` : "Upload CSVs and select a project to begin."}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
              {history.map((entry, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg px-4 py-2.5 bg-signal text-white text-sm">
                      {entry.question}
                    </div>
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-canvas-raised border border-canvas-border space-y-3">
                    <p className="text-sm">{entry.answer}</p>
                    {entry.sql && (
                      <pre className="text-xs bg-canvas-surface border border-canvas-border rounded-md p-3 overflow-x-auto font-mono">
                        {entry.sql}
                      </pre>
                    )}
                    {entry.resultPreview && entry.resultPreview.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full border-collapse">
                          <thead>
                            <tr className="border-b border-canvas-border">
                              {Object.keys(entry.resultPreview[0]).map((col) => (
                                <th key={col} className="text-left py-1.5 pr-4 text-ink-muted font-medium">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {entry.resultPreview.slice(0, 10).map((row, ri) => (
                              <tr key={ri} className="border-b border-canvas-border/50">
                                {Object.values(row).map((val, ci) => (
                                  <td key={ci} className="py-1.5 pr-4">{String(val)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {entry.chart && <ChartRenderer figureJson={entry.chart.figure_json} />}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="rounded-lg px-4 py-3 bg-canvas-raised border border-canvas-border w-fit">
                  <EqBars className="text-signal" />
                </div>
              )}
            </div>
          )}

          <div className="border-t border-canvas-border p-4">
            <div className="max-w-4xl w-full mx-auto">
              {showBanner && <div className="mb-3"><NoKeyBanner provider={provider} /></div>}
              {error && <p className="text-xs text-bad mb-2">{error}</p>}
              <form onSubmit={handleAsk} className="flex items-end gap-2">
                <ProviderSelect value={provider} onChange={setProvider} className="w-32 shrink-0" />
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAsk(e);
                    }
                  }}
                  placeholder="e.g. What were total sales by region last quarter?"
                  rows={1}
                  className="flex-1"
                  disabled={!activeProject}
                />
                <Button type="submit" disabled={!question.trim() || !activeProject || asking}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
