import type { ConfidenceLevel } from "@/lib/types/enums";

const LABELS = ["PRAAT", "GERUCHT", "▲ MEERDERE BRONNEN", "BEVESTIGD"] as const;

/** 4-segment voortgangsbalk; segment- en labelkleuring per bereikte betrouwbaarheidsfase. */
function segmentsFor(confidence: ConfidenceLevel) {
  if (confidence === "PRAATPROGRAMMA") {
    return { fills: ["var(--fg-label)", "var(--track)", "var(--track)", "var(--track)"], activeLabel: 0, activeColor: "var(--fg-label)" };
  }
  if (confidence === "GERUCHT") {
    return { fills: ["var(--fg-label)", "#E0A416", "#E0A416", "var(--track)"], activeLabel: 2, activeColor: "#E0A416" };
  }
  return { fills: ["var(--fg-label)", "#E0A416", "#E0A416", "#39B14E"], activeLabel: 3, activeColor: "#39B14E" };
}

export function ConfidenceMeter({ confidence }: { confidence: ConfidenceLevel }) {
  const { fills, activeLabel, activeColor } = segmentsFor(confidence);

  return (
    <div className="mb-[18px]">
      <div className="mb-1.5 flex gap-[3px]">
        {fills.map((bg, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-sm" style={{ background: bg }} />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[7px] tracking-wide" style={{ color: "var(--fg5)" }}>
        {LABELS.map((label, i) => (
          <span key={label} style={i === activeLabel ? { color: activeColor, fontWeight: 700 } : undefined}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
