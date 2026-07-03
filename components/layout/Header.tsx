import { OssenworstLogo } from "@/components/ui/OssenworstLogo";

/** Rode kopbalk in CM-stijl: wit logo-blok, witte titel, live-stip. */
export function Header() {
  return (
    <div className="flex-none" style={{ background: "var(--ajax-red)" }}>
      <div className="flex h-[54px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div
            className="h-[34px] w-[34px] flex-none rounded-md bg-white p-[3px]"
            style={{ boxShadow: "0 1px 0 rgba(0,0,0,.25)" }}
          >
            <OssenworstLogo className="h-full w-full" />
          </div>
          <div className="leading-tight">
            <div className="text-[17px] font-bold tracking-tight text-white">
              Ossenworst Manager
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
              Al het Ajax-nieuws
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-white/90">
          <span className="osw-pulse h-2 w-2 rounded-full bg-white" />
          LIVE
        </div>
      </div>
      <div className="h-[3px]" style={{ background: "var(--ajax-red-dark)" }} />
    </div>
  );
}
