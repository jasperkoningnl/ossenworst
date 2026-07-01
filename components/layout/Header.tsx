import { OssenworstLogo } from "@/components/ui/OssenworstLogo";

export function Header() {
  return (
    <div className="flex-none" style={{ background: "var(--bar)" }}>
      <div className="flex h-[50px] items-center justify-between px-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-[31px] w-[31px] flex-none rounded-lg p-[3px]"
            style={{ background: "#D2122E", boxShadow: "0 0 0 1px rgba(255,255,255,.14) inset" }}
          >
            <OssenworstLogo className="h-full w-full" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--fg-hi)" }}>
            Ossenworst Manager
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px]" style={{ color: "var(--fg-label)" }}>
          <span
            className="osw-pulse h-1.5 w-1.5 rounded-full"
            style={{ background: "#D2122E" }}
          />
          LIVE
        </div>
      </div>
      <div
        className="h-[2px]"
        style={{ background: "linear-gradient(90deg,#D2122E 0%,#D2122E 38%,#2C6FD6 38%,#2C6FD6 100%)" }}
      />
    </div>
  );
}
