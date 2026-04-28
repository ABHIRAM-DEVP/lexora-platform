"use client";

import Link from "next/link";
import { storeEmailAfterSignup } from "@/context/AuthContext";
import { API_BASE } from "@/lib/config";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text || "Signup failed");
        return;
      }
      storeEmailAfterSignup(email);
      setSuccess("Account created. Redirecting to login...");
      window.setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-4 py-16">
      <div className="lx-card w-full">
        <h1 className="text-xl font-semibold text-[var(--lx-text)]">
          Create a unique Lexora identity
        </h1>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-[var(--lx-text-muted)]">
              Username
            </label>
            <input
              className="lx-input mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--lx-text-muted)]">
              Email
            </label>
            <input
              type="email"
              className="lx-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="lx-btn-primary w-full" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--lx-text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--lx-primary)]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
