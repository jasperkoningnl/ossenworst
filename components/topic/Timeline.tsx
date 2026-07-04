import { CONFIDENCE_COLOR } from "@/lib/theme/colors";
import type { TopicTimelineEntry } from "@/lib/types/feed";

export function Timeline({ entries }: { entries: TopicTimelineEntry[] }) {
  return (
    <div>
      <h3
        className="mb-3.5 border-l-4 pl-2.5 text-[13px] font-bold uppercase tracking-wide"
        style={{ borderColor: "var(--ajax-red)", color: "var(--fg-label)" }}
      >
        Tijdlijn
      </h3>
      <div className="relative mb-6 pl-6">
        <div className="absolute bottom-2 left-[5px] top-1 w-[2px]" style={{ background: "var(--track)" }} />
        {entries.map((entry, i) => {
          const color = CONFIDENCE_COLOR[entry.confidence];
          const headline = (
            <div className="mb-0.5 text-[15px] font-bold leading-snug" style={{ color: "var(--fg-strong)" }}>
              {entry.headline}
              {entry.url && (
                <span className="ml-1.5 text-[13px] font-bold" style={{ color: "var(--ajax-red)" }}>
                  ›
                </span>
              )}
            </div>
          );
          return (
            <div key={i} className="relative mb-5">
              <div
                className="absolute -left-6 top-[3px] h-3 w-3 rounded-full border-2"
                style={{ background: color, borderColor: "var(--bg)", boxShadow: `0 0 0 2px ${color}` }}
              />
              <div className="mb-0.5 text-[11.5px] font-bold uppercase tracking-wide" style={{ color }}>
                {entry.date}
              </div>
              {entry.url ? (
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {headline}
                </a>
              ) : (
                headline
              )}
              <div className="text-[13.5px] leading-normal" style={{ color: "var(--fg2)" }}>
                {entry.snippet}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
