import type { TopicComment } from "@/lib/mock/topics";

export function CommentList({ comments }: { comments: TopicComment[] }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-[13px] w-[3px]" style={{ background: "#2C6FD6" }} />
        <span className="font-mono text-[10px] font-bold tracking-wide" style={{ color: "var(--fg-label)" }}>
          REACTIES ({comments.length})
        </span>
      </div>
      <div className="flex flex-col gap-2.5 pb-6">
        {comments.map((comment, i) => (
          <div
            key={i}
            className="rounded-md border px-3 py-2.5"
            style={{ background: "var(--surfa)", borderColor: "var(--hair2)" }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: comment.isAnonymous ? "var(--fg-label)" : "#C9A227" }}
              >
                {comment.username}
              </span>
              <span className="font-mono text-[8px]" style={{ color: "var(--fg5)" }}>
                {comment.timeAgo}
              </span>
              <span
                className="ml-auto flex items-center gap-1 font-mono text-[9px]"
                style={{ color: "var(--fg3)" }}
              >
                ▲ {comment.upvotes}
              </span>
            </div>
            <div className="text-[13px] leading-snug" style={{ color: "var(--fg-body)" }}>
              {comment.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
