import { SectionTitle } from "@/components/ui/SectionTitle";
import { TeamView } from "@/components/team/TeamView";
import { createClient } from "@/lib/supabase/server";
import { loadPlayers } from "@/lib/players/load";

export default async function TeamPage() {
  const supabase = await createClient();
  const { players } = await loadPlayers(supabase);

  return (
    <div>
      <SectionTitle title="Team" aside="Seizoen 25/26" />
      <TeamView players={players} />
    </div>
  );
}
