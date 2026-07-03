import { sourceTierColors } from "@/lib/theme/colors";
import type { TopicSourceEntry } from "@/lib/types/feed";

export function SourcesList({ sources }: { sources: TopicSourceEntry[] }) {
  return (
    <div>
      <h3
        className="mb-3 border-l-4 pl-2.5 text-[13px] font-bold uppercase tracking-wide"
        style={{ borderColor: "var(--ajax-red)", color: "var(--fg-label)" }}
      >
        Bronnen ({sources.length})
      </h3>
      <div className="mb-6 flex flex-col gap-1.5">
        {sources.map((source, i) => {
          const { bg, fg } = sourceTierColors(source.tier);
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-md border px-3 py-2.5"
              style={{ background: "var(--card)", borderColor: "var(--bd)" }}
            >
              <span
                className="rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                style={{ background: bg, color: fg }}
              >
                Tier {source.tier}
              </span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
                {source.name}
              </span>
              <span className="ml-auto text-[11.5px]" style={{ color: "var(--fg3)" }}>
                {source.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
