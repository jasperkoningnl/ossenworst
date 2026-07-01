"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FormationPicker } from "@/components/tactics/FormationPicker";
import { Pitch } from "@/components/tactics/Pitch";
import { ConsensusList } from "@/components/tactics/ConsensusList";
import { getPitchAssignments, consensusData, type FormationOption } from "@/lib/mock/tactics";

export default function TactiekPage() {
  const [mode, setMode] = useState<"jouw" | "all">("jouw");
  const [formation, setFormation] = useState<FormationOption>("4-3-3");

  return (
    <div>
      <div
        className="flex items-center gap-2.5 border-b px-3.5 py-2.5"
        style={{ background: "var(--head)", borderColor: "var(--bd)" }}
      >
        <span className="h-4 w-1" style={{ background: "#D2122E" }} />
        <span className="text-[17px] font-bold tracking-wide" style={{ color: "var(--fg-hi)" }}>
          TACTIEK
        </span>
      </div>

      <div className="flex gap-[5px] px-3.5 pb-2.5 pt-2.5">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "jouw", label: "JOUW OPSTELLING" },
            { value: "all", label: "ALL-TIME XI" },
          ]}
        />
      </div>

      {mode === "jouw" ? (
        <>
          <FormationPicker value={formation} onChange={setFormation} />
          <Pitch assignments={getPitchAssignments(formation)} />
          <div className="px-3.5 pb-3">
            <button
              className="w-full rounded-[5px] py-2.5 font-mono text-[11.5px] font-bold tracking-wide text-white"
              style={{ background: "#D2122E" }}
            >
              STUUR IN ▸
            </button>
          </div>
          <ConsensusList entries={consensusData} />
        </>
      ) : (
        <div className="px-3.5 py-6 text-[13px]" style={{ color: "var(--fg2)" }}>
          Zoek en stel de beste Ajax-opstelling aller tijden samen — deze mode volgt
          in een latere fase.
        </div>
      )}
    </div>
  );
}
