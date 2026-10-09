import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Pages check again: a layout doesn't re-run on client-side navigation.
  const admin = await requireAdmin();
  return (
    // The backoffice's client components need the Admin namespace too.
    <NextIntlClientProvider messages={await getMessages()}>
      <AdminShell userName={admin.name}>{children}</AdminShell>
    </NextIntlClientProvider>
  );
}
