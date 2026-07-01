"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Nieuws" },
  { href: "/team", label: "Team" },
  { href: "/tactiek", label: "Tactiek" },
  { href: "/transfers", label: "Transfers" },
  { href: "/profiel", label: "Profiel" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface">
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium uppercase tracking-wide ${
                  active ? "text-ajax-red" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
