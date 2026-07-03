import { SectionTitle } from "@/components/ui/SectionTitle";
import { TactiekView } from "@/components/tactics/TactiekView";

export default function TactiekPage() {
  return (
    <div>
      <SectionTitle title="Tactiek" aside="Jouw opstelling" />
      <TactiekView />
    </div>
  );
}
