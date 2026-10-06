import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export const landingSections = [
  { id: "categories", key: "categories" },
  { id: "how-it-works", key: "howItWorks" },
  { id: "offers", key: "offers" },
  { id: "plans", key: "plans" },
  { id: "faq", key: "faq" },
] as const;

export function SiteHeader() {
  const t = useTranslations("Nav");
  const tBrand = useTranslations("Brand");

  return (
    <header className="sticky top-0 z-50 flex h-(--nav-h) items-center bg-[rgba(242,244,248,.72)] backdrop-blur-[18px] backdrop-saturate-[1.4]">
      <div className="wrap flex w-full items-center gap-4 xl:gap-6">
        <Link href="/" aria-label={tBrand("home")} className="rounded-full">
          <Logo hideTaglineOnMobile />
        </Link>

        <nav aria-label={t("label")} className="ml-auto hidden gap-0.5 xl:flex">
          {landingSections.map((s) => (
            // Links point at the home page so they also work from other pages.
            <Link
              key={s.id}
              href={{ pathname: "/", hash: s.id }}
              className="rounded-full px-3 py-3 text-lg font-extrabold whitespace-nowrap text-deep transition-colors hover:bg-cobalt/8 2xl:px-4 2xl:text-[19px]"
            >
              {t(s.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3.5 xl:ml-0">
          <LocaleSwitcher className="hidden md:grid" />
          <Link href="/join" className="btn btn-sun hidden !min-h-[54px] !px-6 !text-[17px] xl:inline-flex">
            {t("activate")}
          </Link>
          <MobileMenu
            labels={{
              open: t("openMenu"),
              close: t("closeMenu"),
              signIn: t("signIn"),
              activate: t("activate"),
              nav: t("label"),
            }}
            sections={landingSections.map((s) => ({ id: s.id, label: t(s.key) }))}
          >
            <LocaleSwitcher />
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
