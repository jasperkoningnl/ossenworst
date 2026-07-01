import { sourceTierColors } from "@/lib/theme/colors";
import type { TopicSourceEntry } from "@/lib/types/feed";

export function SourcesList({ sources }: { sources: TopicSourceEntry[] }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-[13px] w-[3px]" style={{ background: "#2C6FD6" }} />
        <span className="font-mono text-[10px] font-bold tracking-wide" style={{ color: "var(--fg-label)" }}>
          BRONNEN ({sources.length})
        </span>
      </div>
      <div className="mb-5 flex flex-col gap-1.5">
        {sources.map((source, i) => {
          const { bg, fg } = sourceTierColors(source.tier);
          return (
            <div
              key={i}
              className="flex items-center gap-2 rounded border px-2.5 py-2"
              style={{ background: "var(--card)", borderColor: "var(--bd)" }}
            >
              <span
                className="rounded-sm px-1 py-0.5 font-mono text-[7.5px] font-bold tracking-wide"
                style={{ background: bg, color: fg }}
              >
                TIER {source.tier}
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--fg-strong)" }}>
                {source.name}
              </span>
              <span className="font-mono text-[8.5px]" style={{ color: "var(--fg3)" }}>
                {source.date}
              </span>
              <span className="ml-auto font-mono text-[11px]" style={{ color: "#2C6FD6" }}>
                ↗
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
