import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RibeiraScene } from "../landing/ribeira-scene";
import { Icon } from "../icon";
import { LocaleSwitcher } from "../locale-switcher";
import { Logo } from "../logo";
import { MemberCard } from "../member-card";

/** Chrome for sign-in, join and password pages: slim header + Ribeira scene beside the form. */
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Auth");
  const tBrand = useTranslations("Brand");

  return (
    <>
      <header className="flex h-(--nav-h) items-center">
        <div className="wrap flex w-full items-center gap-3">
          <Link href="/" aria-label={tBrand("home")} className="rounded-full">
            <Logo hideTaglineOnMobile />
          </Link>
          <LocaleSwitcher className="ml-auto hidden sm:grid" />
          <Link href="/" className="btn btn-ghost ml-auto !min-h-[54px] !px-5 !text-[17px] sm:ml-0">
            <Icon name="back" className="size-5" strokeWidth={2.4} />
            {t("back")}
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="wrap grid items-center gap-10 pt-2 pb-16 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pt-6">
          <div
            role="img"
            aria-label={t("sceneLabel")}
            className="relative mx-auto hidden aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-t-[999px] rounded-b-[44px] shadow-3 ring-[10px] ring-white/70 lg:block"
          >
            <RibeiraScene />
            <div className="absolute bottom-[7%] left-[6%] w-[72%] -rotate-6">
              <MemberCard name={t("cardName")} number="CP •••• ••••" active={false} />
            </div>
          </div>
          <div className="auth-panel mx-auto w-full max-w-[560px] min-w-0">{children}</div>
        </div>
        <div className="sm:hidden">
          <div className="wrap flex justify-center pb-10">
            <LocaleSwitcher />
          </div>
        </div>
      </main>
    </>
  );
}

/** Sign in | Create account switch at the top of the auth panel. */
export function AuthTabs({ active }: { active: "login" | "join" }) {
  const t = useTranslations("Auth");
  return (
    <nav aria-label={t("tabsLabel")} className="seg-tabs mb-7">
      <Link href="/login" aria-current={active === "login" ? "page" : undefined}>
        {t("tabSignIn")}
      </Link>
      <Link href="/join" aria-current={active === "join" ? "page" : undefined}>
        {t("tabJoin")}
      </Link>
    </nav>
  );
}

export function AuthHeading({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="text-[clamp(32px,4vw,46px)] font-extrabold">{title}</h1>
      {lead && <p className="text-[17px] text-mute">{lead}</p>}
    </div>
  );
}
