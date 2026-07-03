"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "./ThemeToggle";

interface Stats {
  lineups: number;
  outVotes: number;
  wishVotes: number;
}

export function ProfileView() {
  const [username, setUsername] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [stats, setStats] = useState<Stats>({ lineups: 0, outVotes: 0, wishVotes: 0 });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user.id ?? null;
    setHasSession(Boolean(userId));
    if (!userId) return;

    const [profileRes, lineupsRes, votesRes] = await Promise.all([
      supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
      supabase.from("user_lineups").select("id").eq("profile_id", userId),
      supabase.from("transfer_votes").select("id, kind").eq("profile_id", userId),
    ]);
    setUsername(profileRes.data?.username ?? null);
    const votes = votesRes.data ?? [];
    setStats({
      lineups: (lineupsRes.data ?? []).length,
      outVotes: votes.filter((v) => v.kind === "out").length,
      wishVotes: votes.filter((v) => v.kind === "wish").length,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function claim() {
    const name = input.trim();
    if (!name || busy) return;
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    const profileId = await ensureProfile(supabase);
    if (!profileId) {
      setBusy(false);
      setMessage("Inloggen lukte niet — zet anonymous sign-ins aan in Supabase.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ username: name }).eq("id", profileId);
    setBusy(false);
    if (error) {
      setMessage(error.code === "23505" ? "Die naam is al bezet." : "Opslaan mislukte.");
      return;
    }
    setInput("");
    void refresh();
  }

  const displayName = username ?? "Anonieme manager";
  const initial = (username ?? "?").charAt(0).toUpperCase();

  const statTiles = [
    { label: "Opstelling", value: stats.lineups },
    { label: "Transferlijst", value: stats.outVotes },
    { label: "Verlanglijst", value: stats.wishVotes },
  ];

  return (
    <div className="px-4 pt-4">
      <Card className="mb-4 flex items-center gap-3.5 px-4 py-4">
        <div
          className="flex h-12 w-12 flex-none items-center justify-center rounded-md text-xl font-bold text-white"
          style={{ background: "var(--ajax-red)" }}
        >
          {initial}
        </div>
        <div>
          <div className="text-[16px] font-bold leading-tight" style={{ color: "var(--fg)" }}>
            {displayName}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg3)" }}>
            {username ? "Naam geclaimd" : hasSession ? "Anoniem · stemmen tellen mee" : "Nog geen sessie"}
          </div>
        </div>
      </Card>

      <div className="mb-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--fg-label)" }}>
          {username ? "Naam wijzigen" : "Kies een gebruikersnaam"}
        </div>
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void claim();
            }}
            placeholder="bijv. Mister_Ajax"
            className="min-w-0 flex-1 rounded-sm border px-3 py-2.5 text-[14px] outline-none"
            style={{ background: "var(--card)", borderColor: "var(--bd2)", color: "var(--fg)" }}
          />
          <button
            onClick={claim}
            disabled={busy || input.trim().length === 0}
            className="cursor-pointer rounded-sm px-5 text-[13px] font-bold uppercase tracking-wide text-white disabled:opacity-40"
            style={{ background: "var(--ajax-red)" }}
          >
            Claim
          </button>
        </div>
        <p className="mt-1.5 text-[12px]" style={{ color: "var(--fg3)" }}>
          Geen e-mail nodig — je stemmen en opstelling blijven aan dit apparaat gekoppeld.
        </p>
        {message && (
          <p className="mt-1.5 text-[12.5px] font-semibold" style={{ color: "var(--ajax-red)" }}>
            {message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--fg-label)" }}>
          Jouw inzendingen
        </div>
        <div className="flex gap-2">
          {statTiles.map((s) => (
            <Card key={s.label} className="flex-1 px-2.5 py-3.5 text-center">
              <div className="font-mono text-[24px] font-bold" style={{ color: "var(--fg)" }}>
                {s.value}
              </div>
              <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--fg3)" }}>
                {s.label}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <ThemeToggle />
    </div>
  );
}
