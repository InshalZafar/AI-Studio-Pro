"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Send, Trophy } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ProviderSelect } from "@/components/modules/provider-select";
import { Markdown } from "@/components/modules/markdown";
import { NoKeyBanner } from "@/components/modules/no-key-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { EqBars } from "@/components/ui/eq-bars";
import { useApiKeys } from "@/hooks/use-api-keys";
import { api, APIError } from "@/lib/api";
import { SPORTS } from "@/lib/types";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export default function SportsAIPage() {
  const { hasKey, loading: keysLoading } = useApiKeys();
  const [sport, setSport] = useState("cricket");
  const [provider, setProvider] = useState<Provider>("openai");
  const [question, setQuestion] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function switchSport(newSport: string) {
    setSport(newSport);
    setChatId(null);
    setTurns([]);
  }

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setQuestion("");
    setTurns((prev) => [...prev, { role: "user", content: q }]);
    setAsking(true);
    setError(null);
    try {
      const res = await api.post<{ answer: string; chat_id: string }>("/api/sports/chat", {
        sport,
        question: q,
        provider,
        chat_id: chatId,
      });
      setChatId(res.chat_id);
      setTurns((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Something went wrong.");
    } finally {
      setAsking(false);
    }
  }

  const showBanner = !keysLoading && !hasKey(provider);

  return (
    <>
      <Topbar title="Sports AI" subtitle="Rules, history, players, and stats" />
      <div className="flex-1 flex min-h-0">
        <div className="w-56 shrink-0 border-r border-canvas-border p-4 space-y-1">
          {SPORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => switchSport(s.id)}
              className={cn(
                "w-full text-left text-sm rounded-md px-3 py-2.5 transition-colors font-medium",
                sport === s.id
                  ? "bg-signal/10 text-signal"
                  : "text-ink-muted hover:bg-canvas-surface hover:text-ink"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {turns.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Trophy}
                title={`Ask about ${SPORTS.find((s) => s.id === sport)?.label}`}
                description="Rules, history, players, teams, tournaments, and statistics."
              />
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 max-w-3xl w-full mx-auto">
              {turns.map((t, i) => (
                <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2.5",
                      t.role === "user" ? "bg-signal text-white text-sm" : "bg-canvas-raised border border-canvas-border"
                    )}
                  >
                    {t.role === "user" ? t.content : <Markdown content={t.content} />}
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
                  placeholder={`Ask about ${SPORTS.find((s) => s.id === sport)?.label.toLowerCase()}...`}
                  rows={1}
                  className="flex-1"
                />
                <Button type="submit" disabled={!question.trim() || asking}>
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
