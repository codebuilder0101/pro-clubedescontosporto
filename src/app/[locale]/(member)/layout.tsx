import { setRequestLocale } from "next-intl/server";
import { MemberShell } from "@/components/member/member-shell";

export default async function MemberLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MemberShell>{children}</MemberShell>;
}
