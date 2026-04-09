"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(username, password);
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-4 py-16">
      <div className="lx-card w-full">
        <h1 className="text-xl font-semibold text-[var(--lx-text)]">
          Access the Lexora console
        </h1>
        <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
          Sign in with your workspace identity.
        </p>

        {error && (
          <div
            className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-[var(--lx-text-muted)]">
              Username
            </label>
            <input
              className="lx-input mt-1"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--lx-text-muted)]">
              Password
            </label>
            <input
              type="password"
              className="lx-input mt-1"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="lx-btn-primary w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--lx-text-muted)]">
          New here?{" "}
          <Link href="/signup" className="font-medium text-[var(--lx-primary)]">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-[var(--lx-text-muted)]">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
