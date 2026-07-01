import { Card } from "@/components/ui/Card";
import type { TopicSummaryLine } from "@/lib/mock/topics";

export function AISummaryCard({ lines }: { lines: TopicSummaryLine[] }) {
  return (
    <Card className="mb-5 overflow-hidden" borderColor="var(--bd-card)">
      <div
        className="flex items-center gap-1.5 border-b px-3 py-2.5"
        style={{ borderColor: "var(--bd)", background: "var(--cardhd)" }}
      >
        <span className="font-mono text-[9px] font-bold tracking-wide" style={{ color: "#E8485F" }}>
          ◈ AI-SAMENVATTING
        </span>
        <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--fg3)" }}>
          {lines.length} bronnen samengevat
        </span>
      </div>
      <div className="flex flex-col gap-2.5 px-3.5 py-3">
        {lines.map((line, i) => (
          <p key={i} className="text-[13.5px] leading-snug" style={{ color: "var(--fg-body)" }}>
            <span className="font-mono text-[10px] font-bold" style={{ color: "var(--fg-strong)" }}>
              {line.source}
            </span>{" "}
            {line.text}
          </p>
        ))}
      </div>
    </Card>
  );
}
