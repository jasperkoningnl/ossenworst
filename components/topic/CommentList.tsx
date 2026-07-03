import type { TopicComment } from "@/lib/types/feed";
import { CommentForm } from "./CommentForm";

export function CommentList({ comments, topicId }: { comments: TopicComment[]; topicId: string }) {
  return (
    <div>
      <h3
        className="mb-3 border-l-4 pl-2.5 text-[13px] font-bold uppercase tracking-wide"
        style={{ borderColor: "var(--ajax-red)", color: "var(--fg-label)" }}
      >
        Reacties ({comments.length})
      </h3>

      <CommentForm topicId={topicId} />

      <div className="flex flex-col gap-2.5 pb-8">
        {comments.length === 0 && (
          <p className="text-[13px]" style={{ color: "var(--fg3)" }}>
            Nog geen reacties — trap af.
          </p>
        )}
        {comments.map((comment, i) => (
          <div
            key={i}
            className="rounded-md border px-3.5 py-3"
            style={{ background: "var(--card)", borderColor: "var(--bd)" }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className="text-[12.5px] font-bold"
                style={{ color: comment.isAnonymous ? "var(--fg-label)" : "var(--ajax-red)" }}
              >
                {comment.username}
              </span>
              <span className="text-[11px]" style={{ color: "var(--fg5)" }}>
                {comment.timeAgo}
              </span>
            </div>
            <div className="text-[13.5px] leading-normal" style={{ color: "var(--fg-body)" }}>
              {comment.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
