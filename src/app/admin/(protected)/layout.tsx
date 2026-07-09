import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getLocale, getT } from "@/lib/i18n";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Server-side guard for every protected admin page — defense in depth on top of
// the proxy (middleware) check. /admin/login lives OUTSIDE this route group,
// so this layout never wraps it.
export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (isDemoMode()) redirect("/admin/login");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const locale = await getLocale();
  const t = getT(locale);

  return (
    <div className="flex flex-1 bg-white text-ink">
      <AdminSidebar
        labels={{
          title: t("admin.title"),
          dashboard: t("admin.nav.dashboard"),
          products: t("admin.nav.products"),
          categories: t("admin.nav.categories"),
          orders: t("admin.nav.orders"),
          import: t("admin.nav.import"),
          signOut: t("admin.nav.signOut"),
        }}
      />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
