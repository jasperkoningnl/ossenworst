import { tierDotColor } from "@/lib/theme/colors";
import type { TopicSourceEntry } from "@/lib/types/feed";

/**
 * Bronnenlijst met per bron een link naar het originele artikel en een
 * betrouwbaarheidsstip (groen/geel/grijs). Tiers zijn backend-informatie en
 * worden niet als label getoond.
 */
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
          const row = (
            <>
              <span
                className="h-[9px] w-[9px] flex-none rounded-full"
                style={{ background: tierDotColor(source.tier) }}
              />
              <span className="min-w-0 truncate text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
                {source.name}
              </span>
              <span className="ml-auto whitespace-nowrap text-[11.5px]" style={{ color: "var(--fg3)" }}>
                {source.date}
              </span>
              {source.url && (
                <span className="text-[13px] font-bold" style={{ color: "var(--ajax-red)" }}>
                  ›
                </span>
              )}
            </>
          );
          const className = "flex items-center gap-2.5 rounded-md border px-3 py-2.5";
          const style = { background: "var(--card)", borderColor: "var(--bd)" };

          return source.url ? (
            <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className={className} style={style}>
              {row}
            </a>
          ) : (
            <div key={i} className={className} style={style}>
              {row}
            </div>
          );
        })}
      </div>
    </div>
  );
}
