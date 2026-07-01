import Link from "next/link";
import { CATEGORY_COLORS, categoryTextColor } from "@/lib/theme/colors";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { TopicFeedItem } from "@/lib/types/feed";

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString("nl-NL", { month: "short", timeZone: "UTC" }).toUpperCase().replace(".", "");
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${day} ${month} ${time}`;
}

const placeholderStripes = {
  background:
    "repeating-linear-gradient(135deg,var(--track) 0,var(--track) 9px,var(--stripe-b) 9px,var(--stripe-b) 18px)",
};

export function TopicCard({ item, index }: { item: TopicFeedItem; index: number }) {
  const rowBg = index % 2 === 0 ? "var(--surfa)" : "var(--surfb)";
  const spine = CATEGORY_COLORS[item.category];

  return (
    <Link
      href={`/topic/${item.slug}`}
      className="flex w-full border-b text-left"
      style={{ background: rowBg, borderColor: "var(--hair2)" }}
    >
      <div className="w-1 flex-none" style={{ background: spine }} />
      <div className="min-w-0 flex-1">
        {item.hasHero && (
          <div
            className="relative flex h-[150px] items-center justify-center border-b"
            style={{ ...placeholderStripes, borderColor: "var(--hair)" }}
          >
            <span
              className="absolute left-2.5 top-2 rounded-sm px-1.5 py-0.5 font-mono text-[7.5px] font-bold tracking-wide text-white"
              style={{ background: "#D2122E" }}
            >
              FOTO
            </span>
            {item.imageCredit && (
              <span
                className="absolute bottom-2 right-2.5 rounded-sm px-1.5 py-0.5 font-mono text-[7.5px]"
                style={{ color: "var(--fg3)", background: "var(--bg)" }}
              >
                {item.imageCredit}
              </span>
            )}
          </div>
        )}
        <div className="px-3.5 pb-2.5 pt-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wide"
              style={{ background: spine, color: categoryTextColor(item.category) }}
            >
              {item.category}
            </span>
            <ConfidenceBadge confidence={item.confidence} />
            <span className="ml-auto whitespace-nowrap font-mono text-[8px]" style={{ color: "var(--fg5)" }}>
              {formatTimestamp(item.last_activity_at)}
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-base font-semibold leading-tight" style={{ color: "var(--fg)" }}>
                {item.title}
              </div>
              <div className="mb-2 text-[12.5px] leading-tight" style={{ color: "var(--fg2)" }}>
                {item.teaser}
              </div>
            </div>
            {item.hasThumb && (
              <div
                className="relative h-[62px] w-[62px] flex-none overflow-hidden rounded border"
                style={{ ...placeholderStripes, borderColor: "var(--bd2)" }}
              >
                <span
                  className="absolute left-1 top-[3px] font-mono text-[6px] font-bold tracking-wide"
                  style={{ color: "var(--fg3)" }}
                >
                  FOTO
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[8.5px]" style={{ color: "var(--fg3)" }}>
            <span>▣ {item.sourceCount}</span>
            <span>↳ {item.reactionCount}</span>
            {item.trend && (
              <span className="ml-auto font-bold" style={{ color: item.trendColor ?? undefined }}>
                {item.trend}
              </span>
            )}
            {item.hasDetail && (
              <span className="font-bold" style={{ color: "#E8485F" }}>
                ▸ TIJDLIJN
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
