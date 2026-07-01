import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ConsensusEntry } from "@/lib/mock/tactics";

export function ConsensusList({ entries }: { entries: ConsensusEntry[] }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 border-b border-t px-3.5 py-1.5"
        style={{ background: "var(--head)", borderColor: "var(--bd) var(--bd-soft)" }}
      >
        <span className="h-3 w-[3px]" style={{ background: "#2C6FD6" }} />
        <span className="font-mono text-[9px] tracking-wide" style={{ color: "var(--fg-label)" }}>
          WAT DE LEZERS KIEZEN
        </span>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="border-b px-3.5 py-1.5" style={{ borderColor: "var(--hair)" }}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="font-mono text-[9.5px]" style={{ color: "var(--fg2)" }}>
              {entry.positionLabel}
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--fg-strong)" }}>
              {entry.playerName} · {entry.pct}%
            </span>
          </div>
          <ProgressBar pct={entry.pct} color="#F2C94C" />
        </div>
      ))}
    </div>
  );
}
