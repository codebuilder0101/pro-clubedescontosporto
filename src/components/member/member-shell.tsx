import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { LocaleSwitcher } from "../locale-switcher";
import { Logo } from "../logo";
import { SiteFooter } from "../site-footer";
import { MemberDock, MemberNav, type MemberNavItem } from "./member-nav";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Member-area chrome. It only reads the user for the avatar; access control
 * happens in each page (layouts don't re-run on client navigation).
 */
export async function MemberShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("MemberNav");
  const tBrand = await getTranslations("Brand");
  const user = await getCurrentUser();

  const items: MemberNavItem[] = [
    { href: "/home", label: t("home"), icon: "home", tone: "" },
    { href: "/explore", label: t("explore"), icon: "search", tone: "ci-sky" },
    { href: "/card", label: t("card"), icon: "card", tone: "ci-sun" },
    { href: "/account", label: t("account"), icon: "user", tone: "ci-slate" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 flex h-(--nav-h) items-center border-b border-line bg-[rgba(242,244,248,.78)] backdrop-blur-[18px] backdrop-saturate-[1.4]">
        <div className="wrap flex w-full items-center gap-4">
          <Link href="/home" aria-label={tBrand("home")} className="rounded-full">
            <Logo hideTaglineOnMobile />
          </Link>
          <div className="ml-auto lg:ml-8">
            <MemberNav items={items.slice(0, 3)} label={t("label")} />
          </div>
          <LocaleSwitcher className="hidden md:grid lg:ml-auto" />
          {user && (
            <Link href="/account" className="avatar" aria-label={`${t("accountLabel")}: ${user.name}`} title={user.name}>
              {initials(user.name)}
            </Link>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="pb-28 outline-none lg:pb-0">
        {children}
      </main>
      <div className="pb-24 lg:pb-0">
        <SiteFooter />
      </div>
      <MemberDock items={items} label={t("label")} />
    </>
  );
}
