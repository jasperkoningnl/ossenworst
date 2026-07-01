import { CONFIDENCE_COLOR } from "@/lib/theme/colors";
import type { ConfidenceLevel } from "@/lib/types/enums";

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const color = CONFIDENCE_COLOR[confidence];
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[8px] font-semibold tracking-wide"
      style={{ color }}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: color }} />
      {confidence}
    </span>
  );
}
