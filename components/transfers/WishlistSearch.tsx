interface WishlistPlayer {
  name: string;
  club: string;
  position: string;
  age: number;
  value: string;
}

export function WishlistSearch({ selected }: { selected: WishlistPlayer[] }) {
  return (
    <div className="mx-3.5 my-2.5">
      <div
        className="mb-2.5 flex items-center gap-2 rounded border px-2.5 py-2"
        style={{ background: "var(--bg)", borderColor: "var(--bd2)" }}
      >
        <span className="font-mono text-xs" style={{ color: "var(--fg3)" }}>
          ⌕
        </span>
        <span className="text-[13px]" style={{ color: "var(--fg3)" }}>
          Zoek een speler…
        </span>
      </div>
      <div className="mb-2 font-mono text-[9px] tracking-wide" style={{ color: "var(--fg3)" }}>
        JOUW VERLANGLIJST · {selected.length} / 3
      </div>
      <div className="flex flex-col gap-1.5">
        {selected.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-2.5 rounded border px-2.5 py-2"
            style={{ background: "var(--card)", borderColor: "var(--bd2)" }}
          >
            <div
              className="h-[22px] w-[22px] flex-none rounded"
              style={{
                background:
                  "repeating-linear-gradient(135deg,var(--track) 0,var(--track) 3px,var(--stripe-b) 3px,var(--stripe-b) 6px)",
              }}
            />
            <div>
              <div className="text-sm leading-tight" style={{ color: "var(--fg-strong)" }}>
                {p.name}
              </div>
              <div className="mt-0.5 font-mono text-[8px]" style={{ color: "var(--fg3)" }}>
                {p.club.toUpperCase()} · {p.position} · {p.age}
              </div>
            </div>
            <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--fg-c)" }}>
              {p.value}
            </span>
          </div>
        ))}
      </div>
      <button
        className="mt-2.5 w-full rounded-[5px] py-2.5 font-mono text-[11px] font-bold tracking-wide text-white"
        style={{ background: "#D2122E" }}
      >
        STUUR IN ▸
      </button>
    </div>
  );
}
