"use client";

import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
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
  Vrouwenvoetbal: "VROUWENVOETBAL",
};

export function FeedList({ items }: { items: TopicFeedItem[] }) {
  const [filter, setFilter] = useState("Alles");

  const filtered = useMemo(() => {
    if (filter === "Alles") return items;
    return items.filter((it) => it.category === CATEGORY_BY_FILTER[filter]);
  }, [items, filter]);

  return (
    <div>
      <SectionTitle title="Nieuws" aside={`${items.length} topics`} />
      <FilterTabs value={filter} onChange={setFilter} />

      <div className="flex flex-col">
        {filtered.map((item) => (
          <TopicCard key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-sm" style={{ color: "var(--fg2)" }}>
            Nog geen berichten in deze categorie.
          </div>
        )}
      </div>
    </div>
  );
}
