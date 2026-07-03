import { ProgressBar } from "@/components/ui/ProgressBar";

export interface ConsensusEntry {
  positionLabel: string;
  playerName: string;
  pct: number;
}

export function ConsensusList({ entries, total }: { entries: ConsensusEntry[]; total: number }) {
  return (
    <div>
      <div
        className="border-b border-t px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
        style={{ background: "var(--head)", borderColor: "var(--bd)", color: "var(--fg-label)" }}
      >
        Wat de lezers kiezen{total > 0 ? ` · ${total} ${total === 1 ? "inzending" : "inzendingen"}` : ""}
      </div>
      {entries.length === 0 && (
        <p className="px-4 py-4 text-[13px]" style={{ color: "var(--fg3)" }}>
          Nog geen inzendingen voor deze formatie — die van jou kan de eerste zijn.
        </p>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="border-b px-4 py-2" style={{ borderColor: "var(--hair)" }}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg2)" }}>
              {entry.positionLabel}
            </span>
            <span className="text-[14px] font-semibold" style={{ color: "var(--fg-strong)" }}>
              {entry.playerName} · {entry.pct}%
            </span>
          </div>
          <ProgressBar pct={entry.pct} color="var(--ajax-red)" />
        </div>
      ))}
    </div>
  );
}
