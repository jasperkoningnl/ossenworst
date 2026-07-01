"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { VoteList } from "@/components/transfers/VoteList";
import { WishlistSearch } from "@/components/transfers/WishlistSearch";
import { RankingList } from "@/components/transfers/RankingList";
import { transferRank, wishRank, exampleOutVotes, exampleWishlist } from "@/lib/mock/transfers";

export default function TransfersPage() {
  const [tab, setTab] = useState<"list" | "wish">("list");

  return (
    <div>
      <div
        className="flex items-center gap-2.5 border-b px-3.5 py-2.5"
        style={{ background: "var(--head)", borderColor: "var(--bd)" }}
      >
        <span className="h-4 w-1" style={{ background: "#D2122E" }} />
        <span className="text-[17px] font-bold tracking-wide" style={{ color: "var(--fg-hi)" }}>
          TRANSFERS
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
            { value: "list", label: "TRANSFERLIJST" },
            { value: "wish", label: "VERLANGLIJST" },
          ]}
        />
      </div>

      {tab === "list" ? (
        <>
          <VoteList selected={exampleOutVotes} />
          <RankingList
            title="MEEST WEGGESTEMD"
            color="#D2122E"
            entries={transferRank.map((r) => ({ label: r.name, pct: r.pct }))}
          />
        </>
      ) : (
        <>
          <WishlistSearch selected={exampleWishlist} />
          <RankingList
            title="MEEST GEWENSTE AANWINST"
            color="#F2C94C"
            entries={wishRank.map((w) => ({ label: w.name, sublabel: w.club, pct: w.pct }))}
          />
        </>
      )}
    </div>
  );
}
