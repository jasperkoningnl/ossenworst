import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

/**
 * Mobile-first scherm-wrapper: gecentreerde smalle kolom (max-w-md), vaste
 * header + bottom-nav uit het design. De telefoon-bezel/statusbalk uit de
 * Claude Design-preview wordt bewust niet nagebouwd — de echte mobiele
 * browser levert die al.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-md flex-col border-x"
      style={{ background: "var(--bg)", borderColor: "var(--frame)" }}
    >
      <Header />
      <main className="flex-1 pb-[62px]">{children}</main>
      <BottomNav />
    </div>
  );
}
