export function Card({
  children,
  className = "",
  borderColor = "var(--bd-card)",
}: {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}) {
  return (
    <div className={`rounded-md border ${className}`} style={{ background: "var(--card)", borderColor }}>
      {children}
    </div>
  );
}
