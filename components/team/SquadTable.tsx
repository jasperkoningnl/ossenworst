import { POSITION_COLORS } from "@/lib/theme/colors";
import type { Player } from "@/lib/types/database";

function formatValue(value: number | null): string {
  if (value === null) return "—";
  return `€${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
}

function contractShortYear(contractUntil: string | null): string {
  if (!contractUntil) return "—";
  return contractUntil.slice(2, 4);
}

function ageFromBirthDate(birthDate: string | null): number | "—" {
  if (!birthDate) return "—";
  const birthYear = new Date(birthDate).getUTCFullYear();
  return 2026 - birthYear;
}

export function SquadTable({ players }: { players: Player[] }) {
  return (
    <div>
      <div
        className="flex items-center px-3.5 py-1.5 font-mono text-[8px] tracking-wide"
        style={{ background: "var(--bar)", borderBottom: "1px solid var(--bd)", color: "var(--fg3)" }}
      >
        <span className="w-[22px]">#</span>
        <span className="flex-1">SPELER</span>
        <span className="w-[26px] text-center">POS</span>
        <span className="w-7 text-center">LFT</span>
        <span className="w-10 text-right">CONTR.</span>
        <span className="w-12 text-right">WAARDE</span>
      </div>
      {players.map((p, i) => {
        const expiring = p.contract_until ? new Date(p.contract_until).getUTCFullYear() <= 2026 : false;
        return (
          <div
            key={p.id}
            className="flex items-center border-b px-3.5 py-1.5"
            style={{ borderColor: "var(--hair)", background: i % 2 === 0 ? "var(--surfa)" : "var(--surfb)" }}
          >
            <span className="w-[22px] font-mono text-xs font-bold" style={{ color: "#D2122E" }}>
              {p.shirt_number}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className="h-[23px] w-[23px] flex-none rounded border"
                style={{
                  borderColor: "var(--bd2)",
                  background:
                    "repeating-linear-gradient(135deg,var(--track) 0,var(--track) 3px,var(--stripe-b) 3px,var(--stripe-b) 6px)",
                }}
              />
              <div className="min-w-0">
                <div
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-tight"
                  style={{ color: "var(--fg-strong)" }}
                >
                  {p.name}
                </div>
                <div className="font-mono text-[7.5px] tracking-wide" style={{ color: "var(--fg3)" }}>
                  {p.nationality}
                </div>
              </div>
            </div>
            <span
              className="w-[26px] text-center font-mono text-[10px] font-semibold"
              style={{ color: POSITION_COLORS[p.position ?? ""] ?? "var(--fg3)" }}
            >
              {p.position}
            </span>
            <span className="w-7 text-center font-mono text-[10.5px]" style={{ color: "var(--fg-m)" }}>
              {ageFromBirthDate(p.birth_date)}
            </span>
            <span
              className="w-10 text-right font-mono text-[10px]"
              style={{ color: expiring ? "#D2122E" : "var(--fg3)" }}
            >
              &apos;{contractShortYear(p.contract_until)}
            </span>
            <span className="w-12 text-right font-mono text-[10px] font-semibold" style={{ color: "var(--fg-c)" }}>
              {formatValue(p.market_value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
