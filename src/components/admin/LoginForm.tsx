"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

export type AdminLoginLabels = {
  email: string;
  password: string;
  submit: string;
  submitting: string;
  error: string;
};

export default function LoginForm({ labels }: { labels: AdminLoginLabels }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(labels.error);
      setPending(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const inputCls =
    "w-full min-w-0 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-mint focus:outline-none";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">{labels.email}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">{labels.password}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className={
          pending
            ? "cursor-not-allowed rounded-full bg-ink/20 px-5 py-2.5 text-sm font-bold text-white"
            : "rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        }
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
