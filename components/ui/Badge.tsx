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
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${className}`}
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
