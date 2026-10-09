import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localeLabels, locales } from "@/i18n/routing";
import { Icon } from "../icon";

export function PageHeader({ title, eyebrow, actions }: { title: string; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="text-[clamp(30px,4vw,48px)] font-extrabold">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export async function StatusBadge({ status }: { status: string }) {
  const t = await getTranslations("Admin.status");
  return <span className={`status status-${status}`}>{t(status)}</span>;
}

export async function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const t = await getTranslations("Explore");
  return (
    <nav aria-label={t("pagination")} className="mt-6 flex items-center justify-center gap-3">
      {page > 1 && (
        <Link href={href(page - 1)} className="btn btn-ghost !min-h-[46px]" rel="prev">
          <Icon name="back" className="size-5" />
          {t("prev")}
        </Link>
      )}
      <span className="font-bold text-mute">{t("page", { page, count: pageCount })}</span>
      {page < pageCount && (
        <Link href={href(page + 1)} className="btn btn-ghost !min-h-[46px]" rel="next">
          {t("next")}
          <Icon name="next" className="size-5" />
        </Link>
      )}
    </nav>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-linen p-6 text-center font-bold text-mute">{children}</p>;
}

/** "?q=…&page=2" builder that drops empty values. */
export function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
}

export function pageParam(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

export function strParam(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? "").trim().slice(0, 100);
}

/** PT FR ES EN chips: green when that language has content. */
export function LangChips({ present }: { present: string[] }) {
  return (
    <span className="flex gap-1">
      {locales.map((l) => (
        <span key={l} className={`rounded-md px-1.5 text-[12px] font-extrabold ${present.includes(l) ? "bg-[#dff3e9] text-ok" : "bg-[#fff1c7] text-warn"}`}>
          {localeLabels[l]}
        </span>
      ))}
    </span>
  );
}
