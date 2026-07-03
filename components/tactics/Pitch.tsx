"use client";

import type { PitchSlot } from "@/lib/players/formations";

export interface PitchAssignment extends PitchSlot {
  shirtNumber: number | null;
  playerName: string | null;
}

/** Retro groen veld met tik-en-kies posities (geen drag & drop). */
export function Pitch({
  assignments,
  activeSlotId,
  onSlotClick,
}: {
  assignments: PitchAssignment[];
  activeSlotId?: string | null;
  onSlotClick?: (slotId: string) => void;
}) {
  return (
    <div
      className="relative mx-4 mb-3 h-[320px] overflow-hidden rounded-md border-2"
      style={{ background: "linear-gradient(#2c7a3f,#236434)", borderColor: "#1c522a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(#ffffff00,#ffffff00 31px,#ffffff12 31px,#ffffff12 32px)",
        }}
      />
      <div className="absolute inset-2 rounded-sm border-[1.5px]" style={{ borderColor: "#ffffff55" }} />
      <div
        className="absolute left-1/2 top-2 bottom-2 w-[1.5px] -translate-x-1/2"
        style={{ background: "#ffffff55" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px]"
        style={{ borderColor: "#ffffff55" }}
      />
      {assignments.map((a) => {
        const active = a.id === activeSlotId;
        return (
          <button
            key={a.id}
            onClick={() => onSlotClick?.(a.id)}
            className="absolute flex w-[64px] -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1"
            style={{ left: `${a.x}%`, top: `${a.y}%` }}
          >
            <span
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full border-2 font-mono text-[12px] font-bold"
              style={{
                background: a.playerName ? "var(--ajax-red)" : "#ffffffd9",
                color: a.playerName ? "#fff" : "#236434",
                borderColor: active ? "#ffe14d" : "#ffffff",
                boxShadow: active ? "0 0 0 3px #ffe14d88" : "0 2px 5px rgba(0,0,0,.35)",
              }}
            >
              {a.shirtNumber ?? "+"}
            </span>
            <span
              className="whitespace-nowrap rounded-sm px-1.5 py-px text-[10px] font-bold text-white"
              style={{ background: "#00000080" }}
            >
              {a.playerName ?? a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
