import { Card } from "@/components/ui/Card";

const STATS = [
  { label: "OPSTELLING", value: 1 },
  { label: "TRANSFERLIJST", value: 3 },
  { label: "VERLANGLIJST", value: 2 },
] as const;

export function StatsSummary() {
  return (
    <div>
      <div className="mb-2 font-mono text-[9px] tracking-wide" style={{ color: "var(--fg3)" }}>
        JOUW INZENDINGEN
      </div>
      <div className="flex gap-2">
        {STATS.map((s) => (
          <Card key={s.label} className="flex-1 px-2.5 py-3 text-center" borderColor="var(--bd-card)">
            <div className="font-mono text-[22px] font-bold" style={{ color: "var(--fg)" }}>
              {s.value}
            </div>
            <div className="mt-0.5 font-mono text-[7.5px] tracking-wide" style={{ color: "var(--fg3)" }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
