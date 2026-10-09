"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Icon, type IconName } from "../icon";

export type AdminNavItem = { href: string; label: string; icon: IconName; tone: string; badge?: number };

export function AdminNav({ items, label }: { items: AdminNavItem[]; label: string }) {
  const pathname = usePathname();
  const current = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label={label} className="admin-nav -mx-[var(--gutter)] flex gap-1 overflow-x-auto px-[var(--gutter)] pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={current(item.href) ? "page" : undefined}>
          <span className={`ci ${item.tone}`}>
            <Icon name={item.icon} />
          </span>
          {item.label}
          {item.badge ? <span className="ml-auto rounded-full bg-sun px-2 text-[13px] text-ink">{item.badge}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
