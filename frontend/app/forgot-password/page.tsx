"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { api, APIError } from "@/lib/api";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email }, false);
      setSent(true);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      <AuthBrandPanel />
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-6">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>

          {sent ? (
            <div className="flex flex-col items-start gap-3">
              <CheckCircle2 className="h-8 w-8 text-good" />
              <h1 className="font-display text-xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-ink-muted">
                If an account exists for <span className="text-ink">{email}</span>, a reset link is on its way.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold mb-1">Reset password</h1>
              <p className="text-ink-muted text-sm mb-8">We&apos;ll send you a link to get back in.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                {error && <p className="text-sm text-bad">{error}</p>}
                <Button type="submit" className="w-full" loading={loading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
