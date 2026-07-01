import { ProgressBar } from "@/components/ui/ProgressBar";

export interface RankingEntry {
  label: string;
  sublabel?: string;
  pct: number;
}

export function RankingList({
  title,
  entries,
  color,
}: {
  title: string;
  entries: RankingEntry[];
  color: string;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2 border-b border-t px-3.5 py-1.5"
        style={{ background: "var(--head)", borderColor: "var(--bd)" }}
      >
        <span className="h-3 w-[3px]" style={{ background: "#2C6FD6" }} />
        <span className="font-mono text-[9px] tracking-wide" style={{ color: "var(--fg-label)" }}>
          {title}
        </span>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="border-b px-3.5 py-1.5" style={{ borderColor: "var(--hair)" }}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm" style={{ color: "var(--fg-strong)" }}>
              {entry.label}
              {entry.sublabel && (
                <span className="ml-1.5 font-mono text-[8px]" style={{ color: "var(--fg3)" }}>
                  {entry.sublabel}
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] font-bold" style={{ color }}>
              {entry.pct}%
            </span>
          </div>
          <ProgressBar pct={entry.pct} color={color} />
        </div>
      ))}
    </div>
  );
}
