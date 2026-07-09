import { createServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { getLocale, getT } from "@/lib/i18n";

async function fetchCounts(): Promise<{ products: number; newOrders: number }> {
  // Demo mode is unreachable (layout redirects), but never crash without env.
  if (isDemoMode()) return { products: 0, newOrders: 0 };

  try {
    const supabase = await createServerClient();
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_status", "new"),
    ]);
    if (productsRes.error) console.error("admin dashboard products count:", productsRes.error.message);
    if (ordersRes.error) console.error("admin dashboard orders count:", ordersRes.error.message);
    return { products: productsRes.count ?? 0, newOrders: ordersRes.count ?? 0 };
  } catch (e) {
    console.error("admin dashboard counts:", e);
    return { products: 0, newOrders: 0 };
  }
}

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const t = getT(locale);
  const counts = await fetchCounts();

  const cards = [
    { label: t("admin.dashboard.products"), value: counts.products },
    { label: t("admin.dashboard.newOrders"), value: counts.newOrders },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink">{t("admin.dashboard.title")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-ink/60">{card.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
