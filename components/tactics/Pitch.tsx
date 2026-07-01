import type { PitchAssignment } from "@/lib/mock/tactics";

export function Pitch({ assignments }: { assignments: PitchAssignment[] }) {
  return (
    <div
      className="relative mx-3.5 mb-3 h-[300px] overflow-hidden rounded-md border"
      style={{ background: "linear-gradient(#16331F,#102619)", borderColor: "#214029" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(#ffffff00,#ffffff00 29px,#ffffff09 29px,#ffffff09 30px)",
        }}
      />
      <div className="absolute inset-2 rounded-sm border-[1.5px]" style={{ borderColor: "#ffffff2e" }} />
      <div
        className="absolute left-1/2 top-2 bottom-2 w-[1.5px] -translate-x-1/2"
        style={{ background: "#ffffff2e" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px]"
        style={{ borderColor: "#ffffff2e" }}
      />
      {assignments.map((a) => (
        <div
          key={a.id}
          className="absolute flex w-[60px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
        >
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white font-mono text-[11px] font-bold text-white"
            style={{ background: "#D2122E", boxShadow: "0 2px 6px rgba(0,0,0,.5)" }}
          >
            {a.shirtNumber ?? "?"}
          </div>
          <span className="whitespace-nowrap rounded px-1 font-mono text-[8px] font-semibold text-white" style={{ background: "#000000aa" }}>
            {a.playerName}
          </span>
          {a.pct > 0 && (
            <span className="font-mono text-[7.5px] font-bold" style={{ color: "#F2C94C" }}>
              {a.pct}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
