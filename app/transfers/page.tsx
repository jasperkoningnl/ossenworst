import { SectionTitle } from "@/components/ui/SectionTitle";
import { TransfersView } from "@/components/transfers/TransfersView";

export default function TransfersPage() {
  return (
    <div>
      <SectionTitle title="Transfers" aside="Stem mee" />
      <TransfersView />
    </div>
  );
}
