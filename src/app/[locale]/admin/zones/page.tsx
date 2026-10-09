import { getTranslations, setRequestLocale } from "next-intl/server";
import { LangChips, PageHeader } from "@/components/admin/admin-ui";
import { FormAlert } from "@/components/form/field";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { adminMetadata } from "@/lib/admin/metadata";
import { listZones } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/zones">) {
  return adminMetadata((await params).locale, "/admin/zones", "zones");
}

export default async function AdminZones({ params, searchParams }: PageProps<"/[locale]/admin/zones">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const [t, ta, rows] = await Promise.all([getTranslations("Admin.taxonomy"), getTranslations("Admin"), listZones(locale as Locale)]);
  return (
    <>
      <PageHeader
        title={t("zones")}
        actions={
          <Link href="/admin/zones/new" className="btn btn-sun">
            <Icon name="plus" className="size-5" />
            {t("newZone")}
          </Link>
        }
      />
      {(await searchParams).deleted === "1" && (
        <div className="mb-4">
          <FormAlert tone="ok">{ta("deleted")}</FormAlert>
        </div>
      )}
      <ul className="admin-card flex flex-col !p-2">
        {rows.map((z) => (
          <li key={z.id}>
            <Link href={`/admin/zones/${z.id}`} className="row-link">
              <span className="ci ci-leaf [--s:44px]">
                <Icon name="pin" />
              </span>
              <span className="flex-1">
                <b className="block text-deep">{z.name}</b>
                <span className="text-[14px] text-mute">/{z.slug}</span>
              </span>
              <LangChips present={z.locales} />
              <span className="text-[14px] font-bold text-cobalt">{t("venueCount", { count: z._count.venues })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
