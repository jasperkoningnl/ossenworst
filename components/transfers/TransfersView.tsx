"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/auth/session";
import { loadPlayers } from "@/lib/players/load";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { RankingList, type RankingEntry } from "./RankingList";
import type { Player, TransferVote } from "@/lib/types/database";

type VoteRow = Pick<TransferVote, "id" | "profile_id" | "player_id" | "external_player_ref" | "kind">;

const MAX_VOTES = 3;

export function TransfersView() {
  const [tab, setTab] = useState<"list" | "wish">("list");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersFromDb, setPlayersFromDb] = useState(false);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [wishInput, setWishInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [{ players: loadedPlayers, fromDb }, votesRes, sessionRes] = await Promise.all([
      loadPlayers(supabase),
      supabase.from("transfer_votes").select("id, profile_id, player_id, external_player_ref, kind"),
      supabase.auth.getSession(),
    ]);
    setPlayers(loadedPlayers);
    setPlayersFromDb(fromDb);
    setVotes((votesRes.data ?? []) as VoteRow[]);
    setUserId(sessionRes.data.session?.user.id ?? null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const firstSquad = useMemo(() => players.filter((p) => p.squad === "first"), [players]);

  const ownOut = votes.filter((v) => v.kind === "out" && v.profile_id === userId);
  const ownWish = votes.filter((v) => v.kind === "wish" && v.profile_id === userId);

  async function addVote(vote: { player_id?: string; external_player_ref?: string; kind: "out" | "wish" }) {
    if (busy) return;
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    const profileId = await ensureProfile(supabase);
    if (!profileId) {
      setBusy(false);
      setMessage("Inloggen lukte niet — zet anonymous sign-ins aan in Supabase.");
      return;
    }
    const { error } = await supabase.from("transfer_votes").insert({ ...vote, profile_id: profileId });
    setBusy(false);
    if (error) {
      setMessage(error.message.includes("Maximaal") ? "Maximaal 3 spelers per lijst." : "Stemmen mislukte.");
      return;
    }
    void refresh();
  }

  async function removeVote(voteId: string) {
    const supabase = createClient();
    await supabase.from("transfer_votes").delete().eq("id", voteId);
    void refresh();
  }

  // Ranking: percentage van de stemmers die deze speler kozen.
  function ranking(kind: "out" | "wish"): RankingEntry[] {
    const relevant = votes.filter((v) => v.kind === kind);
    const voters = new Set(relevant.map((v) => v.profile_id)).size;
    if (voters === 0) return [];

    const counts = new Map<string, { label: string; count: number }>();
    for (const vote of relevant) {
      let key: string;
      let label: string;
      if (vote.player_id) {
        key = vote.player_id;
        label = playerById.get(vote.player_id)?.name ?? "Onbekende speler";
      } else if (vote.external_player_ref) {
        key = vote.external_player_ref.trim().toLowerCase();
        label = vote.external_player_ref.trim();
      } else {
        continue;
      }
      const existing = counts.get(key);
      counts.set(key, { label, count: (existing?.count ?? 0) + 1 });
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((c) => ({ label: c.label, pct: Math.round((c.count / voters) * 100) }));
  }

  const votedOutPlayerIds = new Set(ownOut.map((v) => v.player_id));

  return (
    <div>
      <div className="border-b px-4 py-3" style={{ background: "var(--head)", borderColor: "var(--bd)" }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "list", label: "Transferlijst" },
            { value: "wish", label: "Verlanglijst" },
          ]}
        />
      </div>

      {tab === "list" ? (
        <>
          <div className="mx-4 my-3 rounded-md border" style={{ background: "var(--card)", borderColor: "var(--bd-card)" }}>
            <div
              className="border-b px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: "var(--cardhd)", borderColor: "var(--bd)", color: "var(--fg-label)" }}
            >
              Jouw transferlijst · {ownOut.length}/{MAX_VOTES}
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {ownOut.map((vote) => {
                const player = vote.player_id ? playerById.get(vote.player_id) : undefined;
                return (
                  <div
                    key={vote.id}
                    className="flex items-center gap-2.5 rounded-sm border px-2.5 py-2"
                    style={{ background: "var(--surfb)", borderColor: "var(--bd)" }}
                  >
                    <span className="font-mono text-[12px] font-bold" style={{ color: "var(--ajax-red)" }}>
                      {player?.shirt_number ?? "–"}
                    </span>
                    <span className="text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
                      {player?.name ?? "Onbekende speler"}
                    </span>
                    <button
                      onClick={() => removeVote(vote.id)}
                      className="ml-auto cursor-pointer px-1 text-[16px]"
                      style={{ color: "var(--fg3)" }}
                      aria-label="Verwijder"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {ownOut.length === 0 && (
                <p className="px-1 py-1 text-[13px]" style={{ color: "var(--fg3)" }}>
                  Kies maximaal 3 spelers die wat jou betreft mogen vertrekken.
                </p>
              )}
              {ownOut.length < MAX_VOTES && playersFromDb && (
                <button
                  onClick={() => setShowPicker((s) => !s)}
                  className="cursor-pointer rounded-sm border border-dashed px-2.5 py-2 text-left text-[13.5px]"
                  style={{ borderColor: "var(--bd-dash)", color: "var(--fg2)" }}
                >
                  + Voeg speler toe
                </button>
              )}
              {!playersFromDb && (
                <p className="px-1 text-[12px]" style={{ color: "var(--fg3)" }}>
                  Stemmen kan zodra de selectie in de database staat (draai de &quot;Seed sources&quot;-workflow).
                </p>
              )}
            </div>
            {showPicker && ownOut.length < MAX_VOTES && (
              <div className="max-h-56 overflow-y-auto border-t" style={{ borderColor: "var(--bd)" }}>
                {firstSquad
                  .filter((p) => !votedOutPlayerIds.has(p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setShowPicker(false);
                        void addVote({ player_id: p.id, kind: "out" });
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 border-b px-3.5 py-2 text-left"
                      style={{ borderColor: "var(--hair)" }}
                    >
                      <span className="w-6 font-mono text-[12px] font-bold" style={{ color: "var(--ajax-red)" }}>
                        {p.shirt_number}
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
                        {p.name}
                      </span>
                      <span className="ml-auto text-[11px] font-bold" style={{ color: "var(--fg3)" }}>
                        {p.position}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <RankingList
            title="Meest weggestemd"
            entries={ranking("out")}
            emptyText="Nog geen stemmen — jouw lijstje kan de trend zetten."
          />
        </>
      ) : (
        <>
          <div className="mx-4 my-3 rounded-md border" style={{ background: "var(--card)", borderColor: "var(--bd-card)" }}>
            <div
              className="border-b px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: "var(--cardhd)", borderColor: "var(--bd)", color: "var(--fg-label)" }}
            >
              Jouw verlanglijst · {ownWish.length}/{MAX_VOTES}
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {ownWish.map((vote) => (
                <div
                  key={vote.id}
                  className="flex items-center gap-2.5 rounded-sm border px-2.5 py-2"
                  style={{ background: "var(--surfb)", borderColor: "var(--bd)" }}
                >
                  <span className="text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
                    {vote.external_player_ref ?? (vote.player_id ? playerById.get(vote.player_id)?.name : "")}
                  </span>
                  <button
                    onClick={() => removeVote(vote.id)}
                    className="ml-auto cursor-pointer px-1 text-[16px]"
                    style={{ color: "var(--fg3)" }}
                    aria-label="Verwijder"
                  >
                    ×
                  </button>
                </div>
              ))}
              {ownWish.length === 0 && (
                <p className="px-1 py-1 text-[13px]" style={{ color: "var(--fg3)" }}>
                  Welke spelers moet Ajax halen? Maximaal 3.
                </p>
              )}
              {ownWish.length < MAX_VOTES && (
                <div className="flex gap-1.5">
                  <input
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && wishInput.trim()) {
                        void addVote({ external_player_ref: wishInput.trim(), kind: "wish" });
                        setWishInput("");
                      }
                    }}
                    placeholder="bijv. Marc-André ter Stegen"
                    className="min-w-0 flex-1 rounded-sm border px-3 py-2 text-[14px] outline-none"
                    style={{ background: "var(--surfb)", borderColor: "var(--bd2)", color: "var(--fg)" }}
                  />
                  <button
                    onClick={() => {
                      if (!wishInput.trim()) return;
                      void addVote({ external_player_ref: wishInput.trim(), kind: "wish" });
                      setWishInput("");
                    }}
                    disabled={busy || wishInput.trim().length === 0}
                    className="cursor-pointer rounded-sm px-4 text-[13px] font-bold text-white disabled:opacity-40"
                    style={{ background: "var(--ajax-red)" }}
                  >
                    Voeg toe
                  </button>
                </div>
              )}
            </div>
          </div>

          <RankingList
            title="Meest gewenste aanwinst"
            entries={ranking("wish")}
            emptyText="Nog geen wensen ingestuurd."
          />
        </>
      )}

      {message && (
        <p className="px-4 py-3 text-[12.5px] font-semibold" style={{ color: "var(--ajax-red)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
