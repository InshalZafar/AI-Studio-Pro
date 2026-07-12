"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { Plus, Send, Trash2, Pencil, Check, X, MessageSquare } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ProviderSelect } from "@/components/modules/provider-select";
import { Markdown } from "@/components/modules/markdown";
import { NoKeyBanner } from "@/components/modules/no-key-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { EqBars } from "@/components/ui/eq-bars";
import { useApiKeys } from "@/hooks/use-api-keys";
import { api, API_URL, getToken } from "@/lib/api";
import type { ChatSummary, ChatDetail, ChatMessage, Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function GeneralAIPage() {
  const { hasKey, loading: keysLoading } = useApiKeys();
  const [conversations, setConversations] = useState<ChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const data = await api.get<ChatSummary[]>("/api/chat/conversations");
    setConversations(data);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText]);

  async function openChat(id: string) {
    setActiveId(id);
    const detail = await api.get<ChatDetail>(`/api/chat/conversations/${id}`);
    setMessages(detail.messages);
    setProvider(detail.provider as Provider);
  }

  function startNewChat() {
    setActiveId(null);
    setMessages([]);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: "temp-user", role: "user", content: text, created_at: new Date().toISOString() },
    ]);
    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ chat_id: activeId, message: text, provider, stream: true }),
      });

      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let newChatId = activeId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.chunk) {
            full += payload.chunk;
            setStreamText(full);
          }
          if (payload.chat_id) newChatId = payload.chat_id;
          if (payload.error) throw new Error(payload.error);
        }
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "temp-user"),
        { id: "u-" + Date.now(), role: "user", content: text, created_at: new Date().toISOString() },
        { id: "a-" + Date.now(), role: "assistant", content: full, created_at: new Date().toISOString() },
      ]);
      setStreamText("");
      if (newChatId && newChatId !== activeId) {
        setActiveId(newChatId);
        loadConversations();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`,
          created_at: new Date().toISOString(),
        },
      ]);
      setStreamText("");
    } finally {
      setStreaming(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/chat/conversations/${id}`);
    if (activeId === id) startNewChat();
    loadConversations();
  }

  async function submitRename(id: string) {
    if (renameValue.trim()) {
      await api.patch(`/api/chat/conversations/${id}`, { title: renameValue.trim() });
      loadConversations();
    }
    setRenamingId(null);
  }

  const showBanner = !keysLoading && !hasKey(provider);

  return (
    <>
      <Topbar title="General AI" subtitle="Streaming chat across any provider" />
      <div className="flex-1 flex min-h-0">
        {/* Conversation list */}
        <div className="w-64 shrink-0 border-r border-canvas-border flex flex-col">
          <div className="p-3 border-b border-canvas-border">
            <Button variant="secondary" size="sm" className="w-full" onClick={startNewChat}>
              <Plus className="h-3.5 w-3.5" /> New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm cursor-pointer",
                  activeId === c.id ? "bg-signal/10 text-signal" : "text-ink-muted hover:bg-canvas-surface hover:text-ink"
                )}
                onClick={() => openChat(c.id)}
              >
                {renamingId === c.id ? (
                  <>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.key === "Enter" && submitRename(c.id)}
                      className="flex-1 bg-canvas-surface border border-canvas-border rounded px-1.5 py-0.5 text-xs outline-none"
                    />
                    <button onClick={(e) => { e.stopPropagation(); submitRename(c.id); }}>
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(null); }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate">{c.title}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 hover:text-signal"
                      onClick={(e) => { e.stopPropagation(); setRenamingId(c.id); setRenameValue(c.title); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="opacity-0 group-hover:opacity-100 hover:text-bad"
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-ink-faint text-center py-6">No conversations yet</p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {messages.length === 0 && !streaming ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Start a conversation"
                description="Ask anything. Pick a provider below and send your first message."
              />
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 max-w-3xl w-full mx-auto">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2.5",
                      m.role === "user"
                        ? "bg-signal text-white"
                        : "bg-canvas-raised border border-canvas-border"
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <Markdown content={m.content} />
                    )}
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-2.5 bg-canvas-raised border border-canvas-border">
                    {streamText ? <Markdown content={streamText} /> : <EqBars className="text-signal" />}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-canvas-border p-4">
            <div className="max-w-3xl w-full mx-auto">
              {showBanner && <div className="mb-3"><NoKeyBanner provider={provider} /></div>}
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <ProviderSelect value={provider} onChange={setProvider} className="w-32 shrink-0" />
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Send a message..."
                  rows={1}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || streaming} size="md">
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
