import { Card } from "@/components/ui/Card";

export function VoteList({ selected }: { selected: { shirtNumber: number; name: string }[] }) {
  return (
    <Card className="mx-3.5 my-2.5 px-3 py-2.5">
      <div className="mb-2.5 font-mono text-[9px] tracking-wide" style={{ color: "var(--fg3)" }}>
        KIES MAX. 3 SPELERS DIE WEG MOETEN
      </div>
      <div className="flex flex-col gap-1.5">
        {selected.map((p) => (
          <div
            key={p.shirtNumber}
            className="flex items-center gap-2 rounded border px-2 py-2"
            style={{ background: "var(--bg)", borderColor: "var(--bd2)" }}
          >
            <span className="font-mono text-[11px] font-bold" style={{ color: "#D2122E" }}>
              {p.shirtNumber}
            </span>
            <span className="text-sm" style={{ color: "var(--fg-strong)" }}>
              {p.name}
            </span>
            <span className="ml-auto font-mono text-[13px]" style={{ color: "var(--fg3)" }}>
              ×
            </span>
          </div>
        ))}
        {selected.length < 3 && (
          <div
            className="rounded border border-dashed px-2.5 py-2 text-sm"
            style={{ borderColor: "var(--bd-dash)", color: "var(--fg5)" }}
          >
            + Voeg speler toe
          </div>
        )}
      </div>
      <button
        className="mt-2.5 w-full rounded-[5px] py-2.5 font-mono text-[11px] font-bold tracking-wide text-white"
        style={{ background: "#D2122E" }}
      >
        STUUR IN ▸
      </button>
    </Card>
  );
}
