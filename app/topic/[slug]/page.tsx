import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryTag } from "@/components/topic/CategoryTag";
import { ConfidenceBadge } from "@/components/topic/ConfidenceBadge";
import { SourceIntroCard } from "@/components/topic/SourceIntroCard";
import { Timeline } from "@/components/topic/Timeline";
import { SourcesList } from "@/components/topic/SourcesList";
import { CommentList } from "@/components/topic/CommentList";
import { getTopicDetailBySlug } from "@/lib/data/topics";

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
    .toLowerCase();
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getTopicDetailBySlug(slug);
  if (!result) notFound();

  const { item, detail } = result;

  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center gap-2.5 border-b px-4 py-3"
        style={{ background: "var(--bar)", borderColor: "var(--bd)" }}
      >
        <Link
          href="/"
          className="text-[13px] font-bold uppercase tracking-wide"
          style={{ color: "var(--ajax-red)" }}
        >
          ‹ Terug
        </Link>
        <div className="ml-auto">
          <CategoryTag category={item.category} />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <ConfidenceBadge confidence={item.confidence} />
          <span className="ml-auto text-[11.5px]" style={{ color: "var(--fg3)" }}>
            {item.sourceCount} {item.sourceCount === 1 ? "bron" : "bronnen"}
          </span>
        </div>

        <h1 className="mb-1.5 text-[25px] font-bold leading-tight" style={{ color: "var(--fg-hi)" }}>
          {item.title}
        </h1>
        <div className="mb-4 text-[12.5px]" style={{ color: "var(--fg3)" }}>
          Bijgewerkt {formatDate(item.last_activity_at)} · loopt sinds {formatDate(detail.sagaStartedAt)}
        </div>

        {detail.intro && <SourceIntroCard intro={detail.intro} />}
        <Timeline entries={detail.timeline} />
        <SourcesList sources={detail.sources} />
        <CommentList comments={detail.comments} topicId={item.id} />
      </div>
    </div>
  );
}
