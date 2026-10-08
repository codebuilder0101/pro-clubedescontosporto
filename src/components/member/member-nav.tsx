"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Icon, type IconName } from "../icon";

export type MemberNavItem = { href: "/home" | "/explore" | "/card" | "/account"; label: string; icon: IconName; tone: string };

function isCurrent(pathname: string, href: string) {
  if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/offers/");
  return pathname === href;
}

/** Desktop pills in the header. */
export function MemberNav({ items, label }: { items: MemberNavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="mnav hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
          <span className={`ci ${item.tone}`}>
            <Icon name={item.icon} />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Bottom dock on phones and tablets. */
export function MemberDock({ items, label }: { items: MemberNavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="dock">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
          <span className={`ci ${item.tone}`}>
            <Icon name={item.icon} />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
