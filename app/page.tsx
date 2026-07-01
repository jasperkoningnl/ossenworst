"use client";

import { useMemo, useState } from "react";
import { FilterTabs } from "@/components/topic/FilterTabs";
import { TopicCard } from "@/components/topic/TopicCard";
import { topicFeed } from "@/lib/mock/topics";

export default function Home() {
  const [filter, setFilter] = useState("Alles");

  const items = useMemo(() => {
    if (filter === "Alles") return topicFeed;
    const categoryByLabel: Record<string, string> = {
      Transfers: "TRANSFER",
      Staf: "STAF",
      Club: "CLUB",
      Eredivisie: "EREDIVISIE",
      "Ex-spelers": "EX-SPELER",
      Wedstrijden: "WEDSTRIJD",
    };
    return topicFeed.filter((it) => it.category === categoryByLabel[filter]);
  }, [filter]);

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
          {topicFeed.length} BERICHTEN
        </span>
      </div>

      <FilterTabs value={filter} onChange={setFilter} />

      <div className="flex flex-col">
        {items.map((item, i) => (
          <TopicCard key={item.id} item={item} index={i} />
        ))}
        <div className="py-4 text-center font-mono text-[8.5px]" style={{ color: "var(--fg6)" }}>
          — EINDE FEED —
        </div>
      </div>
    </div>
  );
}
