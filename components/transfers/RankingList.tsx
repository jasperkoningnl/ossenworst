import { ProgressBar } from "@/components/ui/ProgressBar";

export interface RankingEntry {
  label: string;
  sublabel?: string;
  pct: number;
}

export function RankingList({
  title,
  entries,
  emptyText,
}: {
  title: string;
  entries: RankingEntry[];
  emptyText: string;
}) {
  return (
    <div>
      <div
        className="border-b border-t px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
        style={{ background: "var(--head)", borderColor: "var(--bd)", color: "var(--fg-label)" }}
      >
        {title}
      </div>
      {entries.length === 0 && (
        <p className="px-4 py-4 text-[13px]" style={{ color: "var(--fg3)" }}>
          {emptyText}
        </p>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="border-b px-4 py-2" style={{ borderColor: "var(--hair)" }}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
              {entry.label}
              {entry.sublabel && (
                <span className="ml-2 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "var(--fg3)" }}>
                  {entry.sublabel}
                </span>
              )}
            </span>
            <span className="font-mono text-[13px] font-bold" style={{ color: "var(--ajax-red)" }}>
              {entry.pct}%
            </span>
          </div>
          <ProgressBar pct={entry.pct} color="var(--ajax-red)" />
        </div>
      ))}
    </div>
  );
}
