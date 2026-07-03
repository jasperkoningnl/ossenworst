"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SquadTable } from "@/components/team/SquadTable";
import { squadValue } from "@/lib/players/squad.seed";
import type { Player } from "@/lib/types/database";

export function TeamView({ players }: { players: Player[] }) {
  const [tab, setTab] = useState<"eerste" | "jong">("eerste");
  const shown = players.filter((p) => (tab === "eerste" ? p.squad === "first" : p.squad === "jong"));

  return (
    <div>
      <div className="border-b px-4 py-3" style={{ background: "var(--head)", borderColor: "var(--bd)" }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "eerste", label: "Eerste elftal" },
            { value: "jong", label: "Jong Ajax" },
          ]}
        />
      </div>

      <SquadTable players={shown} />

      <div
        className="flex justify-between px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--fg3)" }}
      >
        <span>Selectiewaarde</span>
        <span style={{ color: "var(--fg-c)" }}>{squadValue(shown)}</span>
      </div>
    </div>
  );
}
