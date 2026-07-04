import Link from "next/link";
import { OssenworstLogo } from "@/components/ui/OssenworstLogo";
import { getLatestUpdateAt } from "@/lib/data/topics";

const HEADER_TIMEZONE = "Europe/Amsterdam";

/** "4 jul, 15:42" (in Nederlandse tijd, dus incl. zomertijd). */
function formatUpdateTime(iso: string): string {
  const d = new Date(iso);
  const day = Number(
    d.toLocaleString("nl-NL", { day: "numeric", timeZone: HEADER_TIMEZONE })
  );
  const month = d.toLocaleString("nl-NL", { month: "short", timeZone: HEADER_TIMEZONE }).replace(".", "");
  const time = d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: HEADER_TIMEZONE });
  return `${day} ${month}, ${time}`;
}

/** Rode kopbalk in CM-stijl: wit logo-blok, witte titel, laatste update. */
export async function Header() {
  const latestUpdateAt = await getLatestUpdateAt();

  return (
    <div className="flex-none" style={{ background: "var(--ajax-red)" }}>
      <div className="flex h-[54px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="h-[34px] w-[34px] flex-none rounded-md bg-white p-[3px]"
            style={{ boxShadow: "0 1px 0 rgba(0,0,0,.25)" }}
          >
            <OssenworstLogo className="h-full w-full" />
          </div>
          <div className="text-[17px] font-bold tracking-tight text-white">Ossenworst Manager</div>
        </Link>
        {latestUpdateAt && (
          <div className="text-[10px] font-bold tracking-widest text-white/90">
            {formatUpdateTime(latestUpdateAt)}
          </div>
        )}
      </div>
      <div className="h-[3px]" style={{ background: "var(--ajax-red-dark)" }} />
    </div>
  );
}
