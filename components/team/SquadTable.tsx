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
  return new Date().getUTCFullYear() - birthYear;
}

/** CM-stijl selectietabel: zebra-rijen, rugnummer in rood, aflopend contract gemarkeerd. */
export function SquadTable({ players }: { players: Player[] }) {
  const currentYear = new Date().getUTCFullYear();

  return (
    <div>
      <div
        className="flex items-center border-b px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider"
        style={{ background: "var(--head)", borderColor: "var(--bd)", color: "var(--fg-label)" }}
      >
        <span className="w-7">#</span>
        <span className="flex-1">Speler</span>
        <span className="w-8 text-center">Pos</span>
        <span className="w-8 text-center">Lft</span>
        <span className="w-11 text-right">Contr</span>
        <span className="w-14 text-right">Waarde</span>
      </div>
      {players.map((p, i) => {
        const expiring = p.contract_until
          ? new Date(p.contract_until).getUTCFullYear() <= currentYear
          : false;
        return (
          <div
            key={p.id}
            className="flex items-center border-b px-4 py-2.5"
            style={{ borderColor: "var(--hair)", background: i % 2 === 0 ? "var(--surfa)" : "var(--surfb)" }}
          >
            <span className="w-7 font-mono text-[13px] font-bold" style={{ color: "var(--ajax-red)" }}>
              {p.shirt_number}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-semibold leading-tight"
                style={{ color: "var(--fg-strong)" }}
              >
                {p.name}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg3)" }}>
                {p.nationality}
              </div>
            </div>
            <span
              className="w-8 text-center text-[12px] font-bold"
              style={{ color: POSITION_COLORS[p.position ?? ""] ?? "var(--fg3)" }}
            >
              {p.position}
            </span>
            <span className="w-8 text-center font-mono text-[12px]" style={{ color: "var(--fg-m)" }}>
              {ageFromBirthDate(p.birth_date)}
            </span>
            <span
              className="w-11 text-right font-mono text-[12px]"
              style={{ color: expiring ? "var(--ajax-red)" : "var(--fg3)", fontWeight: expiring ? 700 : 400 }}
            >
              &apos;{contractShortYear(p.contract_until)}
            </span>
            <span className="w-14 text-right font-mono text-[12px] font-semibold" style={{ color: "var(--fg-c)" }}>
              {formatValue(p.market_value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
