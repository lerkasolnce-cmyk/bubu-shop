import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";
import CartView from "@/components/CartView";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getT(locale);
  return { title: t("cart.title") };
}

export default async function CartPage() {
  const locale = await getLocale();
  const t = getT(locale);

  const labels = {
    title: t("cart.title"),
    empty: t("cart.empty"),
    emptyCta: t("cart.emptyCta"),
    total: t("cart.total"),
    checkout: t("cart.checkout"),
    remove: t("cart.remove"),
    increase: t("cart.increase"),
    decrease: t("cart.decrease"),
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <CartView locale={locale} labels={labels} />
    </div>
  );
}
