import { CONFIDENCE_LABEL } from "@/lib/theme/colors";
import type { ConfidenceLevel } from "@/lib/types/enums";

const STEPS: ConfidenceLevel[] = ["PRAATPROGRAMMA", "GERUCHT", "BEVESTIGD"];
const STEP_COLORS = ["var(--fg-label)", "var(--rumor)", "var(--confirmed)"];

/** Drie-staps betrouwbaarheidsmeter: praatprogramma → gerucht → bevestigd. */
export function ConfidenceMeter({ confidence }: { confidence: ConfidenceLevel }) {
  const reached = STEPS.indexOf(confidence);

  return (
    <div className="mb-5">
      <div className="mb-1.5 flex gap-1">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className="h-2 flex-1 rounded-sm"
            style={{ background: i <= reached ? STEP_COLORS[reached] : "var(--track)" }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg5)" }}>
        {STEPS.map((step, i) => (
          <span key={step} style={i === reached ? { color: STEP_COLORS[reached] } : undefined}>
            {CONFIDENCE_LABEL[step]}
          </span>
        ))}
      </div>
    </div>
  );
}
