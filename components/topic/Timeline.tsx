import { CONFIDENCE_COLOR } from "@/lib/theme/colors";
import type { TopicTimelineEntry } from "@/lib/types/feed";

export function Timeline({ entries }: { entries: TopicTimelineEntry[] }) {
  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2">
        <span className="h-[13px] w-[3px]" style={{ background: "#2C6FD6" }} />
        <span className="font-mono text-[10px] font-bold tracking-wide" style={{ color: "var(--fg-label)" }}>
          TIJDLIJN VAN HET GERUCHT
        </span>
      </div>
      <div className="relative mb-5 pl-[22px]">
        <div
          className="absolute bottom-2 left-[5px] top-1 w-[2px]"
          style={{ background: "linear-gradient(var(--fg-label), #E0A416)" }}
        />
        {entries.map((entry, i) => {
          const color = CONFIDENCE_COLOR[entry.confidence];
          return (
            <div key={i} className="relative mb-[15px]">
              <div
                className="absolute -left-[22px] top-[1px] h-3 w-3 rounded-full border-2"
                style={{ background: color, borderColor: "var(--bg)", boxShadow: `0 0 0 2px ${color}` }}
              />
              <div className="mb-0.5 flex items-center gap-2">
                <span className="font-mono text-[9.5px] font-bold" style={{ color }}>
                  {entry.date}
                </span>
                <span className="font-mono text-[8px]" style={{ color: "var(--fg3)" }}>
                  {entry.delta}
                </span>
              </div>
              <div className="mb-0.5 text-[15px] font-semibold leading-tight" style={{ color: "var(--fg-strong)" }}>
                {entry.headline}
              </div>
              <div className="text-[12.5px] leading-snug" style={{ color: "var(--fg2)" }}>
                {entry.snippet}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
