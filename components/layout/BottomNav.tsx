"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Nieuws",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <line x1="7" y1="9" x2="13" y2="9" />
        <line x1="7" y1="13" x2="17" y2="13" />
        <line x1="7" y1="16.5" x2="17" y2="16.5" />
      </>
    ),
  },
  {
    href: "/team",
    label: "Team",
    icon: <path d="M9 4 6 6.5 4 8.5 6 11v9h12v-9l2-2.5L18 4l-3 1.5C14 6.5 10 6.5 9 4Z" />,
  },
  {
    href: "/tactiek",
    label: "Tactiek",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    href: "/transfers",
    label: "Transfers",
    icon: (
      <>
        <path d="M6 8h11l-3-3" />
        <path d="M18 16H7l3 3" />
      </>
    ),
  },
  {
    href: "/profiel",
    label: "Profiel",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.6 3.2-5.5 7-5.5s7 1.9 7 5.5" />
      </>
    ),
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/topic");
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[62px] max-w-md border-t-2"
      style={{ background: "var(--bar)", borderColor: "var(--ajax-red)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1"
            style={{
              color: active ? "#fff" : "var(--fg3)",
              background: active ? "var(--ajax-red)" : "transparent",
            }}
            aria-current={active ? "page" : undefined}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              {item.icon}
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
