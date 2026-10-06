import { useTranslations } from "next-intl";
import { Notice } from "@/components/placeholder-page";
import { SiteShell } from "@/components/site-shell";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <SiteShell>
      <Notice eyebrow={t("eyebrow")} heading="404" title={t("title")} text={t("text")} back={t("back")} />
    </SiteShell>
  );
}
