import { Card } from "@/components/ui/Card";

export function ProfileCard() {
  return (
    <Card className="mb-4 flex items-center gap-3 px-3.5 py-3.5" borderColor="var(--bd-card)">
      <div
        className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-md font-mono text-lg font-bold text-white"
        style={{ background: "#D2122E" }}
      >
        ?
      </div>
      <div>
        <div className="text-base font-semibold leading-tight" style={{ color: "var(--fg)" }}>
          Anonieme manager
        </div>
        <div className="mt-0.5 font-mono text-[8.5px]" style={{ color: "var(--fg3)" }}>
          GEEN ACCOUNT · STEMMEN TELLEN MEE
        </div>
      </div>
    </Card>
  );
}
