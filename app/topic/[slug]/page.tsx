import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryTag } from "@/components/topic/CategoryTag";
import { ConfidenceBadge } from "@/components/topic/ConfidenceBadge";
import { ConfidenceMeter } from "@/components/topic/ConfidenceMeter";
import { AISummaryCard } from "@/components/topic/AISummaryCard";
import { Timeline } from "@/components/topic/Timeline";
import { SourcesList } from "@/components/topic/SourcesList";
import { CommentList } from "@/components/topic/CommentList";
import { findTopicBySlug, topicDetails } from "@/lib/mock/topics";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findTopicBySlug(slug);
  if (!item) notFound();

  const detail = topicDetails[item.id];

  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center gap-2.5 border-b px-3 py-2.5"
        style={{ background: "var(--bar)", borderColor: "var(--bd)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold"
          style={{ color: "var(--fg-c)" }}
        >
          ‹ TERUG
        </Link>
        <div className="ml-auto">
          <CategoryTag category={item.category} />
        </div>
      </div>

      <div className="px-3.5 pt-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <ConfidenceBadge confidence={item.confidence} />
          <span className="ml-auto font-mono text-[8.5px]" style={{ color: "var(--fg3)" }}>
            {item.sourceCount} BRONNEN
          </span>
        </div>

        <h1 className="mb-1.5 text-[27px] font-bold leading-tight" style={{ color: "var(--fg-hi)" }}>
          {item.title}
        </h1>
        <div className="mb-3.5 font-mono text-[8.5px]" style={{ color: "var(--fg3)" }}>
          BIJGEWERKT {new Date(item.last_activity_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" }).toUpperCase()}
          {detail && ` · SAGA LOOPT SINDS ${new Date(detail.sagaStartedAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "short" }).toUpperCase()}`}
        </div>

        {item.hasHero && (
          <div className="mb-[18px]">
            <div
              className="relative h-[190px] overflow-hidden rounded-lg border"
              style={{
                borderColor: "var(--bd-card)",
                background:
                  "repeating-linear-gradient(135deg,var(--track) 0,var(--track) 10px,var(--stripe-b) 10px,var(--stripe-b) 20px)",
              }}
            >
              <span
                className="absolute left-2.5 top-2.5 rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wide text-white"
                style={{ background: "#D2122E" }}
              >
                FOTO
              </span>
            </div>
            {detail && (
              <div className="flex justify-between gap-2.5 pt-1.5 font-mono text-[8px] leading-snug">
                <span style={{ color: "var(--fg2)" }}>{detail.imageCaption}</span>
                <span className="whitespace-nowrap" style={{ color: "var(--fg3)" }}>
                  {detail.imageCredit}
                </span>
              </div>
            )}
          </div>
        )}

        <ConfidenceMeter confidence={item.confidence} />

        {detail ? (
          <>
            <AISummaryCard lines={detail.summaryLines} />
            <Timeline entries={detail.timeline} />
            <SourcesList sources={detail.sources} />
            <CommentList comments={detail.comments} />
          </>
        ) : (
          <p className="pb-8 text-[13px]" style={{ color: "var(--fg2)" }}>
            Nog geen uitgebreide tijdlijn beschikbaar voor dit bericht.
          </p>
        )}
      </div>
    </div>
  );
}
