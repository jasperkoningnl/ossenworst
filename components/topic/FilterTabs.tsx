"use client";

import { useRef } from "react";
import type { TopicCategory } from "@/lib/types/enums";

export const FEED_FILTERS: { label: string; category: TopicCategory | null }[] = [
  { label: "Alles", category: null },
  { label: "Transfers", category: "TRANSFER" },
  { label: "Staf", category: "STAF" },
  { label: "Club", category: "CLUB" },
  { label: "Eredivisie", category: "EREDIVISIE" },
  { label: "Ex-spelers", category: "EX-SPELER" },
  { label: "Wedstrijden", category: "WEDSTRIJD" },
  { label: "Vrouwen", category: "VROUWEN" },
];

export function FilterTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (label: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Zonder dit blijft de balk op desktop onbereikbaar voor alles voorbij het
  // scherm: de scrollbar is bewust verborgen (.osw-scroll) en een gewoon
  // muiswiel scrollt alleen verticaal. Verticale wielbeweging hier vertalen
  // naar horizontale scroll geeft desktopgebruikers dezelfde swipe-ervaring
  // als touch.
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }

  return (
    <div
      ref={scrollerRef}
      onWheel={handleWheel}
      className="osw-scroll flex gap-1.5 overflow-x-auto border-b px-4 py-2.5"
      style={{ background: "var(--head)", borderColor: "var(--bd)" }}
    >
      {FEED_FILTERS.map((f) => {
        const active = f.label === value;
        return (
          <button
            key={f.label}
            onClick={() => onChange(f.label)}
            className="flex-none cursor-pointer rounded-sm border px-3 py-1.5 text-[12.5px] font-semibold"
            style={{
              background: active ? "var(--ajax-red)" : "var(--chip)",
              color: active ? "#fff" : "var(--fg2)",
              borderColor: active ? "var(--ajax-red-dark)" : "var(--bd2)",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
