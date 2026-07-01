"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SquadTable } from "@/components/team/SquadTable";
import { eersteElftal, jongAjax, squadValue } from "@/lib/mock/players";

export default function TeamPage() {
  const [tab, setTab] = useState<"eerste" | "jong">("eerste");
  const players = tab === "eerste" ? eersteElftal : jongAjax;

  return (
    <div>
      <div
        className="flex items-center gap-2.5 border-b px-3.5 py-2.5"
        style={{ background: "var(--head)", borderColor: "var(--bd)" }}
      >
        <span className="h-4 w-1" style={{ background: "#D2122E" }} />
        <span className="text-[17px] font-bold tracking-wide" style={{ color: "var(--fg-hi)" }}>
          TEAM
        </span>
      </div>

      <div
        className="flex gap-[5px] border-b px-3.5 py-2.5"
        style={{ background: "var(--head)", borderColor: "var(--bd-soft)" }}
      >
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "eerste", label: "EERSTE ELFTAL" },
            { value: "jong", label: "JONG AJAX" },
          ]}
        />
      </div>

      <SquadTable players={players} />

      <div
        className="flex justify-between px-3.5 py-3 font-mono text-[9px]"
        style={{ color: "var(--fg3)" }}
      >
        <span>SELECTIEWAARDE</span>
        <span className="font-bold" style={{ color: "var(--fg-c)" }}>
          {squadValue(players)}
        </span>
      </div>
    </div>
  );
}
