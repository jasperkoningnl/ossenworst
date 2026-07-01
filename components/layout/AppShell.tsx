import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

/**
 * Mobile-first scherm-wrapper: gecentreerde smalle kolom (max-w-md), sticky
 * header, ruimte onderaan voor de vaste BottomNav. Bewust dun gehouden zodat
 * het definitieve Claude Design-bestand de visuele afwerking kan aansturen.
 */
export function AppShell({
  children,
  title = "",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <Header title={title} />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
