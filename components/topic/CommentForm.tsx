"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/auth/session";

export function CommentForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const profileId = await ensureProfile(supabase);
    const { error: insertError } = await supabase
      .from("comments")
      .insert({ topic_id: topicId, profile_id: profileId, body: text });

    setBusy(false);
    if (insertError) {
      setError("Reageren lukte niet. Probeer het later opnieuw.");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <div className="mb-3.5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Schrijf een reactie…"
        rows={2}
        className="w-full resize-none rounded-md border px-3 py-2.5 text-[14px] outline-none"
        style={{ background: "var(--card)", borderColor: "var(--bd2)", color: "var(--fg)" }}
      />
      <div className="mt-1.5 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy || body.trim().length === 0}
          className="cursor-pointer rounded-md px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          style={{ background: "var(--ajax-red)" }}
        >
          {busy ? "Versturen…" : "Plaats reactie"}
        </button>
        {error && (
          <span className="text-[12px]" style={{ color: "var(--ajax-red)" }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
