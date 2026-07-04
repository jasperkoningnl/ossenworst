import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABEL } from "@/lib/theme/colors";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { TopicFeedItem } from "@/lib/types/feed";

/** "Zojuist", "12 min", "3 uur", of anders een korte datum. */
function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 2) return "zojuist";
  if (minutes < 60) return `${minutes} min geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const d = new Date(iso);
  const month = d.toLocaleString("nl-NL", { month: "short", timeZone: "UTC" }).replace(".", "");
  return `${d.getUTCDate()} ${month}`;
}

export function TopicCard({ item }: { item: TopicFeedItem }) {
  const spine = CATEGORY_COLORS[item.category];

  return (
    <Link
      href={`/topic/${item.slug}`}
      className="flex w-full border-b bg-white text-left"
      style={{ background: "var(--surfa)", borderColor: "var(--hair2)" }}
    >
      <div className="w-[5px] flex-none" style={{ background: spine }} />
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: spine }}>
            {CATEGORY_LABEL[item.category] ?? item.category}
          </span>
          <ConfidenceBadge confidence={item.confidence} />
          <span className="ml-auto whitespace-nowrap text-[11px]" style={{ color: "var(--fg5)" }}>
            {relativeTime(item.last_activity_at)}
          </span>
        </div>
        <div className="mb-2 flex gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="mb-1 text-[17px] font-bold leading-snug" style={{ color: "var(--fg-hi)" }}>
              {item.title}
            </h2>
            {item.teaser && (
              <p className="text-[13.5px] leading-normal" style={{ color: "var(--fg2)" }}>
                {item.teaser}
              </p>
            )}
          </div>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- externe nieuwsafbeeldingen, domeinen onbekend
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              // Nieuws-CDN's blokkeren hotlinks met een vreemde referrer;
              // zonder referrer laden ze wel.
              referrerPolicy="no-referrer"
              className="h-[72px] w-[96px] flex-none rounded-md border object-cover"
              style={{ borderColor: "var(--bd)" }}
            />
          )}
        </div>
        <div className="flex items-center gap-3 text-[11.5px] font-semibold" style={{ color: "var(--fg3)" }}>
          <span>
            {item.sourceCount} {item.sourceCount === 1 ? "bron" : "bronnen"}
          </span>
          {item.commentCount > 0 && (
            <span>
              {item.commentCount} {item.commentCount === 1 ? "reactie" : "reacties"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
