export function Card({
  children,
  className = "",
  borderColor = "var(--bd)",
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
