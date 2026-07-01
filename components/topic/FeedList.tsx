"use client";

import { useMemo, useState } from "react";
import { FilterTabs } from "@/components/topic/FilterTabs";
import { TopicCard } from "@/components/topic/TopicCard";
import type { TopicFeedItem } from "@/lib/types/feed";

const CATEGORY_BY_FILTER: Record<string, string> = {
  Transfers: "TRANSFER",
  Staf: "STAF",
  Club: "CLUB",
  Eredivisie: "EREDIVISIE",
  "Ex-spelers": "EX-SPELER",
  Wedstrijden: "WEDSTRIJD",
};

export function FeedList({ items }: { items: TopicFeedItem[] }) {
  const [filter, setFilter] = useState("Alles");

  const filtered = useMemo(() => {
    if (filter === "Alles") return items;
    return items.filter((it) => it.category === CATEGORY_BY_FILTER[filter]);
  }, [items, filter]);

  return (
    <div>
      <div
        className="flex items-center gap-2.5 border-b px-3.5 py-2.5"
        style={{ background: "var(--head)", borderColor: "var(--bd)" }}
      >
        <span className="h-4 w-1" style={{ background: "#D2122E" }} />
        <span className="text-[17px] font-bold tracking-wide" style={{ color: "var(--fg-hi)" }}>
          NIEUWS
        </span>
        <span className="ml-auto font-mono text-[9px]" style={{ color: "var(--fg3)" }}>
          {items.length} BERICHTEN
        </span>
      </div>

      <FilterTabs value={filter} onChange={setFilter} />

      <div className="flex flex-col">
        {filtered.map((item, i) => (
          <TopicCard key={item.id} item={item} index={i} />
        ))}
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm" style={{ color: "var(--fg2)" }}>
            Nog geen berichten in deze categorie.
          </div>
        ) : (
          <div className="py-4 text-center font-mono text-[8.5px]" style={{ color: "var(--fg6)" }}>
            — EINDE FEED —
          </div>
        )}
      </div>
    </div>
  );
}
