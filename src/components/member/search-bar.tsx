import Form from "next/form";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CategoryInfo, ZoneInfo } from "@/lib/offers";
import { Icon } from "../icon";

/**
 * Search by text, category and area. A plain GET form (next/form adds
 * client-side navigation), so it also works without JavaScript.
 */
export async function SearchBar({
  categories,
  zones,
  defaults = {},
}: {
  categories: CategoryInfo[];
  zones: ZoneInfo[];
  defaults?: { q?: string; category?: string; zone?: string };
}) {
  const t = await getTranslations("Search");
  const locale = (await getLocale()) as Locale;

  return (
    <Form action={getPathname({ locale, href: "/explore" })} role="search" aria-label={t("label")} className="search-bar">
      <label className="field">
        <span className="ci [--s:44px]" aria-hidden="true">
          <Icon name="search" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="field-label">{t("q")}</span>
          <input type="search" name="q" defaultValue={defaults.q} placeholder={t("qPlaceholder")} maxLength={80} enterKeyHint="search" />
        </span>
      </label>
      <label className="field">
        <span className="ci ci-roof [--s:44px]" aria-hidden="true">
          <Icon name="grid" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="field-label">{t("category")}</span>
          <select name="category" defaultValue={defaults.category ?? ""}>
            <option value="">{t("allCategories")}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </span>
        <Icon name="chev" className="size-5 flex-none text-mute" aria-hidden="true" />
      </label>
      <label className="field">
        <span className="ci ci-leaf [--s:44px]" aria-hidden="true">
          <Icon name="pin" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="field-label">{t("zone")}</span>
          <select name="zone" defaultValue={defaults.zone ?? ""}>
            <option value="">{t("allZones")}</option>
            {zones.map((z) => (
              <option key={z.slug} value={z.slug}>
                {z.name}
              </option>
            ))}
          </select>
        </span>
        <Icon name="chev" className="size-5 flex-none text-mute" aria-hidden="true" />
      </label>
      <button type="submit" className="btn btn-sun md:ml-2">
        {t("submit")}
      </button>
    </Form>
  );
}
