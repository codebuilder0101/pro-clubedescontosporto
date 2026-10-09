import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";

type FooterLink = { label: string; href: string | { pathname: "/"; hash: string } };

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const year = new Date().getFullYear();
  const home = (hash: string) => ({ pathname: "/" as const, hash });

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: t("club"),
      links: [
        { label: tNav("howItWorks"), href: home("how-it-works") },
        { label: tNav("plans"), href: home("plans") },
        { label: tNav("faq"), href: home("faq") },
        { label: t("partners"), href: "/partners" },
      ],
    },
    {
      title: t("categories"),
      links: [
        { label: t("restaurants"), href: home("categories") },
        { label: t("bars"), href: home("categories") },
        { label: t("cultureEvents"), href: home("categories") },
      ],
    },
    {
      title: t("account"),
      links: [
        { label: t("signIn"), href: "/login" },
        { label: t("myCard"), href: "/card" },
      ],
    },
  ];

  return (
    <footer className="footer pt-16 pb-10">
      <div className="wrap grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-[18px]">
          <Logo tone="light" />
          <p className="max-w-[34ch]">{t("about")}</p>
          <LocaleSwitcher tone="dark" />
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3.5 text-lg font-bold text-white">{col.title}</h2>
            <ul>
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="inline-block py-1.5 font-semibold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="flex flex-wrap justify-between gap-5 border-t border-white/12 pt-6 text-[15px] sm:col-span-2 lg:col-span-4">
          <span>{t("copyright", { year })}</span>
          <nav aria-label={t("legal")}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li>
                <Link href="/terms">{t("terms")}</Link>
              </li>
              <li>
                <Link href="/privacy">{t("privacy")}</Link>
              </li>
              <li>
                <Link href="/cookies">{t("cookies")}</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
