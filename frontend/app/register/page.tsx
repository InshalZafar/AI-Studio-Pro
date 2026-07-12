"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { APIError } from "@/lib/api";
import { AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName);
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
          <h1 className="font-display text-2xl font-semibold mb-1">Create your studio</h1>
          <p className="text-ink-muted text-sm mb-8">Bring your own API keys, start building.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Full name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-bad bg-bad/10 border border-bad/20 rounded-md px-3 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="text-sm text-ink-muted mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-signal hover:text-signal-soft font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
