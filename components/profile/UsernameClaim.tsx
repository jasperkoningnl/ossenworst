export function UsernameClaim() {
  return (
    <div className="mb-[18px]">
      <div className="mb-2 font-mono text-[9px] tracking-wide" style={{ color: "var(--fg3)" }}>
        MAAK EEN GEBRUIKERSNAAM
      </div>
      <div className="mb-1.5 flex gap-1.5">
        <div
          className="flex-1 rounded-[5px] border px-3 py-2.5 text-[13px]"
          style={{ background: "var(--bg)", borderColor: "var(--bd2)", color: "var(--fg3)" }}
        >
          bijv. Mister_Ajax
        </div>
        <button
          className="rounded-[5px] px-4 font-mono text-[11px] font-bold text-white"
          style={{ background: "#D2122E" }}
        >
          CLAIM
        </button>
      </div>
      <div className="mb-[18px] text-xs" style={{ color: "var(--fg3)" }}>
        Geen e-mail nodig. Zo laagdrempelig mogelijk.
      </div>
    </div>
  );
}
