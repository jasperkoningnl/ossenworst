export function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-[3px]" style={{ background: "var(--track)" }}>
      <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
