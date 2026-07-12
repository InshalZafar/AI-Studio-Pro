"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { Upload, FileText, Trash2, Send, File as FileIcon } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProviderSelect } from "@/components/modules/provider-select";
import { Markdown } from "@/components/modules/markdown";
import { NoKeyBanner } from "@/components/modules/no-key-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { EqBars } from "@/components/ui/eq-bars";
import { useApiKeys } from "@/hooks/use-api-keys";
import { api, APIError } from "@/lib/api";
import type { DocumentItem, SourceCitation, Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QAEntry {
  question: string;
  answer: string;
  sources: SourceCitation[];
}

export default function DocumentAIPage() {
  const { hasKey, loading: keysLoading } = useApiKeys();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<QAEntry[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    const data = await api.get<DocumentItem[]>("/api/documents");
    setDocuments(data);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      await api.post("/api/documents/upload", form);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/documents/${id}`);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    loadDocuments();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || selected.size === 0 || asking) return;
    setAsking(true);
    setError(null);
    const q = question.trim();
    setQuestion("");
    try {
      const res = await api.post<{ answer: string; sources: SourceCitation[]; chat_id: string }>(
        "/api/documents/chat",
        {
          document_ids: Array.from(selected),
          question: q,
          provider,
          chat_id: chatId,
        }
      );
      setChatId(res.chat_id);
      setHistory((prev) => [...prev, { question: q, answer: res.answer, sources: res.sources }]);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Something went wrong.");
    } finally {
      setAsking(false);
    }
  }

  const showBanner = !keysLoading && !hasKey(provider);

  return (
    <>
      <Topbar title="Document AI" subtitle="Upload files and ask grounded questions" />
      <div className="flex-1 flex min-h-0">
        {/* Document list / upload */}
        <div className="w-80 shrink-0 border-r border-canvas-border flex flex-col">
          <div className="p-4 border-b border-canvas-border">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
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
              <Upload className="h-3.5 w-3.5" /> Upload PDF / DOCX / TXT / MD
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                onClick={() => toggleSelect(doc.id)}
                className={cn(
                  "p-3 cursor-pointer flex items-start gap-2.5",
                  selected.has(doc.id) ? "border-signal bg-signal/5" : "hover:bg-canvas-surface"
                )}
              >
                <FileText className={cn("h-4 w-4 mt-0.5 shrink-0", selected.has(doc.id) ? "text-signal" : "text-ink-muted")} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{doc.filename}</p>
                  <p className="text-[10px] text-ink-faint uppercase mt-0.5">
                    {doc.file_type} · {doc.chunk_count} chunks
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="text-ink-faint hover:text-bad shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Card>
            ))}
            {documents.length === 0 && (
              <p className="text-xs text-ink-faint text-center py-6">No documents uploaded yet</p>
            )}
          </div>
        </div>

        {/* Q&A area */}
        <div className="flex-1 flex flex-col min-w-0">
          {history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={FileIcon}
                title="Ask your documents"
                description="Upload files on the left, select one or more, then ask a question below."
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl w-full mx-auto">
              {history.map((entry, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg px-4 py-2.5 bg-signal text-white text-sm">
                      {entry.question}
                    </div>
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-canvas-raised border border-canvas-border">
                    <Markdown content={entry.answer} />
                    {entry.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-canvas-border space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wide text-ink-faint font-medium">Sources</p>
                        {entry.sources.map((s, si) => (
                          <div key={si} className="text-xs text-ink-muted flex items-start gap-1.5">
                            <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="truncate">
                              <span className="text-ink">{s.filename}</span> — {s.chunk_text.slice(0, 100)}...
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
            <div className="max-w-3xl w-full mx-auto">
              {showBanner && <div className="mb-3"><NoKeyBanner provider={provider} /></div>}
              {error && <p className="text-xs text-bad mb-2">{error}</p>}
              {selected.size === 0 && documents.length > 0 && (
                <p className="text-xs text-ink-faint mb-2">Select at least one document to ask a question.</p>
              )}
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
                  placeholder="Ask a question about the selected documents..."
                  rows={1}
                  className="flex-1"
                  disabled={selected.size === 0}
                />
                <Button type="submit" disabled={!question.trim() || selected.size === 0 || asking}>
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
