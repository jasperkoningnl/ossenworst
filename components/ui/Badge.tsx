export function Badge({
  children,
  bg,
  fg = "#ffffff",
  className = "",
}: {
  children: React.ReactNode;
  bg: string;
  fg?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider ${className}`}
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
