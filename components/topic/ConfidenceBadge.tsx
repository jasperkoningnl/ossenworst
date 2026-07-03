import { CONFIDENCE_COLOR, CONFIDENCE_LABEL } from "@/lib/theme/colors";
import type { ConfidenceLevel } from "@/lib/types/enums";

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const color = CONFIDENCE_COLOR[confidence];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ color }}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}
