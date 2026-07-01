"use client";

import type { TopicCategory } from "@/lib/types/enums";

export const FEED_FILTERS: { label: string; category: TopicCategory | null }[] = [
  { label: "Alles", category: null },
  { label: "Transfers", category: "TRANSFER" },
  { label: "Staf", category: "STAF" },
  { label: "Club", category: "CLUB" },
  { label: "Eredivisie", category: "EREDIVISIE" },
  { label: "Ex-spelers", category: "EX-SPELER" },
  { label: "Wedstrijden", category: "WEDSTRIJD" },
];

export function FilterTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (label: string) => void;
}) {
  return (
    <div
      className="osw-scroll flex gap-[5px] overflow-x-auto border-b px-3.5 pb-[11px] pt-2.5"
      style={{ background: "var(--head)", borderColor: "var(--bd-soft)" }}
    >
      {FEED_FILTERS.map((f) => {
        const active = f.label === value;
        return (
          <button
            key={f.label}
            onClick={() => onChange(f.label)}
            className="flex-none rounded-[3px] border px-2.5 py-1.5 font-mono text-[9.5px] font-semibold tracking-wide"
            style={{
              background: active ? "#D2122E" : "var(--chip)",
              color: active ? "#fff" : "var(--fg2)",
              borderColor: active ? "#D2122E" : "var(--bd2)",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
