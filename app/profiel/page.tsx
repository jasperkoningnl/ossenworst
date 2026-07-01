import { ProfileCard } from "@/components/profile/ProfileCard";
import { UsernameClaim } from "@/components/profile/UsernameClaim";
import { StatsSummary } from "@/components/profile/StatsSummary";
import { ThemeToggle } from "@/components/profile/ThemeToggle";

export default function ProfielPage() {
  return (
    <div>
      <div
        className="flex items-center gap-2.5 border-b px-3.5 py-2.5"
        style={{ background: "var(--head)", borderColor: "var(--bd)" }}
      >
        <span className="h-4 w-1" style={{ background: "#D2122E" }} />
        <span className="text-[17px] font-bold tracking-wide" style={{ color: "var(--fg-hi)" }}>
          PROFIEL
        </span>
      </div>

      <div className="px-3.5 pt-3.5">
        <ProfileCard />
        <ThemeToggle />
        <UsernameClaim />
        <StatsSummary />
      </div>
    </div>
  );
}
