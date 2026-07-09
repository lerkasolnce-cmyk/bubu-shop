"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-ink/60 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
