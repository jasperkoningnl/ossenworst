/**
 * CM 01/02-achtige sectietitelbalk: vol rood vlak met witte condensed
 * kapitalen. Optioneel een klein wit sublabel rechts.
 */
export function SectionTitle({
  title,
  aside,
}: {
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="osw-titlebar">
      <span className="text-[17px] font-bold uppercase tracking-[0.08em]">{title}</span>
      {aside && <span className="ml-auto text-[11px] font-semibold text-white/80">{aside}</span>}
    </div>
  );
}
