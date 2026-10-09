import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { Icon } from "../icon";
import { LocaleSwitcher } from "../locale-switcher";
import { Logo } from "../logo";
import { AdminNav, type AdminNavItem } from "./admin-nav";

/** Backoffice chrome: header, side navigation (top bar on phones), content. */
export async function AdminShell({ children, userName }: { children: ReactNode; userName: string }) {
  const t = await getTranslations("Admin.nav");
  const newRequests = await db.partnerRequest.count({ where: { status: "NEW" } });

  const items: AdminNavItem[] = [
    { href: "/admin", label: t("dashboard"), icon: "chart", tone: "" },
    { href: "/admin/offers", label: t("offers"), icon: "ticket", tone: "ci-sun" },
    { href: "/admin/venues", label: t("venues"), icon: "store", tone: "ci-roof" },
    { href: "/admin/categories", label: t("categories"), icon: "grid", tone: "ci-violet" },
    { href: "/admin/zones", label: t("zones"), icon: "pin", tone: "ci-leaf" },
    { href: "/admin/members", label: t("members"), icon: "people", tone: "ci-sky" },
    { href: "/admin/partner-requests", label: t("partnerRequests"), icon: "inbox", tone: "ci-wine", badge: newRequests },
    { href: "/admin/audit", label: t("audit"), icon: "list", tone: "ci-slate" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-[rgba(242,244,248,.85)] backdrop-blur-[18px]">
        <div className="wrap flex h-(--nav-h) items-center gap-3">
          <Link href="/admin" className="flex items-center gap-3 rounded-full" aria-label={t("dashboard")}>
            <Logo hideTaglineOnMobile />
          </Link>
          <span className="hidden rounded-full bg-deep px-3 py-1 text-[13px] font-extrabold tracking-[0.1em] text-white uppercase sm:inline">{t("badge")}</span>
          <LocaleSwitcher className="ml-auto hidden md:grid" />
          <Link href="/home" className="btn btn-ghost ml-auto !min-h-[46px] !px-4 !text-[15px] md:ml-0" title={userName}>
            <Icon name="external" className="size-5" />
            <span className="hidden sm:inline">{t("viewSite")}</span>
          </Link>
        </div>
      </header>
      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-6 pt-5 pb-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:pt-8">
        <aside className="min-w-0 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
          <AdminNav items={items} label={t("label")} />
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </>
  );
}
