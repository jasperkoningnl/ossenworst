export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
      <h1 className="text-sm font-bold uppercase tracking-wider text-foreground">
        <span className="text-ajax-red">Ossenworst</span> Manager
        {title ? <span className="text-muted"> · {title}</span> : null}
      </h1>
    </header>
  );
}
