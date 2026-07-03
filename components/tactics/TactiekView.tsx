"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/auth/session";
import { loadPlayers } from "@/lib/players/load";
import { formationSlots, FORMATION_OPTIONS, type FormationOption } from "@/lib/players/formations";
import { FormationPicker } from "./FormationPicker";
import { Pitch, type PitchAssignment } from "./Pitch";
import { ConsensusList, type ConsensusEntry } from "./ConsensusList";
import type { Player, UserLineup } from "@/lib/types/database";

interface FormationRow {
  id: string;
  name: string;
}

function surname(name: string): string {
  return name.split(" ").slice(-1)[0];
}

export function TactiekView() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersFromDb, setPlayersFromDb] = useState(false);
  const [formations, setFormations] = useState<FormationRow[]>([]);
  const [allLineups, setAllLineups] = useState<Pick<UserLineup, "formation_id" | "slots" | "profile_id">[]>([]);
  const [formation, setFormation] = useState<FormationOption>("4-3-3");
  const [slots, setSlots] = useState<Record<string, string | null>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [{ players: loadedPlayers, fromDb }, formationsRes, lineupsRes, sessionRes] = await Promise.all([
      loadPlayers(supabase),
      supabase.from("formations").select("id, name"),
      supabase.from("user_lineups").select("formation_id, slots, profile_id").eq("mode", "current"),
      supabase.auth.getSession(),
    ]);
    setPlayers(loadedPlayers);
    setPlayersFromDb(fromDb);
    const formationRows = (formationsRes.data ?? []) as FormationRow[];
    setFormations(formationRows);
    const lineups = (lineupsRes.data ?? []) as Pick<UserLineup, "formation_id" | "slots" | "profile_id">[];
    setAllLineups(lineups);

    // Eigen opstelling terugzetten in de UI.
    const userId = sessionRes.data.session?.user.id;
    if (userId) {
      const own = lineups.find((l) => l.profile_id === userId);
      if (own) {
        const ownFormation = formationRows.find((f) => f.id === own.formation_id)?.name as
          | FormationOption
          | undefined;
        if (ownFormation && FORMATION_OPTIONS.includes(ownFormation)) {
          setFormation(ownFormation);
          setSlots(own.slots as Record<string, string | null>);
        }
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const firstSquad = useMemo(() => players.filter((p) => p.squad === "first"), [players]);
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const formationIdByName = useMemo(() => new Map(formations.map((f) => [f.name, f.id])), [formations]);

  const assignments: PitchAssignment[] = formationSlots[formation].map((slot) => {
    const player = slots[slot.id] ? playerById.get(slots[slot.id]!) : undefined;
    return {
      ...slot,
      shirtNumber: player?.shirt_number ?? null,
      playerName: player ? surname(player.name) : null,
    };
  });

  const chosenIds = new Set(Object.values(slots).filter(Boolean) as string[]);

  function assign(playerId: string) {
    if (!activeSlot) return;
    setSlots((prev) => {
      const next = { ...prev };
      // Speler die al elders stond, verhuist naar het nieuwe slot.
      for (const key of Object.keys(next)) {
        if (next[key] === playerId) next[key] = null;
      }
      next[activeSlot] = playerId;
      return next;
    });
    setActiveSlot(null);
  }

  async function save() {
    const formationId = formationIdByName.get(formation);
    if (!formationId || busy) return;
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    const profileId = await ensureProfile(supabase);
    if (!profileId) {
      setBusy(false);
      setMessage("Inloggen lukte niet — zet anonymous sign-ins aan in Supabase.");
      return;
    }

    // Eén actuele opstelling per gebruiker: oude weggooien, nieuwe erin.
    await supabase.from("user_lineups").delete().eq("profile_id", profileId).eq("mode", "current");
    const { error } = await supabase.from("user_lineups").insert({
      profile_id: profileId,
      formation_id: formationId,
      slots,
      mode: "current",
    });

    setBusy(false);
    if (error) {
      setMessage("Opslaan mislukt. Probeer het later opnieuw.");
      return;
    }
    setMessage("Opstelling ingestuurd!");
    void refresh();
  }

  // Consensus: per slot de meest gekozen speler binnen dezelfde formatie.
  const consensus: { entries: ConsensusEntry[]; total: number } = useMemo(() => {
    const formationId = formationIdByName.get(formation);
    if (!formationId) return { entries: [], total: 0 };
    const relevant = allLineups.filter((l) => l.formation_id === formationId);
    if (relevant.length === 0) return { entries: [], total: 0 };

    const entries: ConsensusEntry[] = [];
    for (const slot of formationSlots[formation]) {
      const counts = new Map<string, number>();
      for (const lineup of relevant) {
        const playerId = (lineup.slots as Record<string, string | null>)[slot.id];
        if (playerId) counts.set(playerId, (counts.get(playerId) ?? 0) + 1);
      }
      let topId: string | null = null;
      let topCount = 0;
      for (const [id, count] of counts) {
        if (count > topCount) {
          topId = id;
          topCount = count;
        }
      }
      const player = topId ? playerById.get(topId) : undefined;
      if (player) {
        entries.push({
          positionLabel: slot.label,
          playerName: surname(player.name),
          pct: Math.round((topCount / relevant.length) * 100),
        });
      }
    }
    return { entries, total: relevant.length };
  }, [allLineups, formation, formationIdByName, playerById]);

  const canSave = playersFromDb && formationIdByName.has(formation);

  return (
    <div>
      <div className="px-4 pt-3">
        <FormationPicker
          value={formation}
          onChange={(f) => {
            setFormation(f);
            setSlots({});
            setActiveSlot(null);
          }}
        />
      </div>

      <Pitch
        assignments={assignments}
        activeSlotId={activeSlot}
        onSlotClick={(id) => setActiveSlot(activeSlot === id ? null : id)}
      />

      {activeSlot && (
        <div className="mx-4 mb-3 rounded-md border" style={{ background: "var(--card)", borderColor: "var(--bd-card)" }}>
          <div
            className="border-b px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: "var(--cardhd)", borderColor: "var(--bd)", color: "var(--fg-label)" }}
          >
            Kies een speler voor {formationSlots[formation].find((s) => s.id === activeSlot)?.label}
          </div>
          <div className="max-h-56 overflow-y-auto">
            {firstSquad.map((p) => {
              const taken = chosenIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => assign(p.id)}
                  className="flex w-full cursor-pointer items-center gap-2.5 border-b px-3.5 py-2 text-left"
                  style={{ borderColor: "var(--hair)", opacity: taken ? 0.45 : 1 }}
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
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          onClick={save}
          disabled={!canSave || busy}
          className="w-full cursor-pointer rounded-md py-3 text-[14px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
          style={{ background: "var(--ajax-red)" }}
        >
          {busy ? "Versturen…" : "Stuur opstelling in"}
        </button>
        {!playersFromDb && (
          <p className="mt-2 text-[12px]" style={{ color: "var(--fg3)" }}>
            Insturen kan zodra de selectie in de database staat (draai de &quot;Seed sources&quot;-workflow).
          </p>
        )}
        {message && (
          <p className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--fg2)" }}>
            {message}
          </p>
        )}
      </div>

      <ConsensusList entries={consensus.entries} total={consensus.total} />
    </div>
  );
}
