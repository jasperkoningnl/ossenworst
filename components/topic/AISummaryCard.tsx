import { Card } from "@/components/ui/Card";

/** Samenvattingskaart: de lopende AI-samenvatting van het topic ("Volgens X…"). */
export function AISummaryCard({ summary, sourceCount }: { summary: string; sourceCount: number }) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div
        className="flex items-center gap-2 border-b px-3.5 py-2"
        style={{ borderColor: "var(--bd)", background: "var(--cardhd)" }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ajax-red)" }}>
          Samenvatting
        </span>
        <span className="ml-auto text-[11px]" style={{ color: "var(--fg3)" }}>
          {sourceCount} {sourceCount === 1 ? "bron" : "bronnen"}
        </span>
      </div>
      <p className="px-4 py-3.5 text-[14.5px] leading-relaxed" style={{ color: "var(--fg-body)" }}>
        {summary}
      </p>
    </Card>
  );
}
