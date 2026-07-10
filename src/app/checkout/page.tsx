import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";
import CheckoutForm from "@/components/CheckoutForm";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getT(locale);
  return { title: t("checkout.title") };
}

export default async function CheckoutPage() {
  const locale = await getLocale();
  const t = getT(locale);

  const labels = {
    title: t("checkout.title"),
    name: t("checkout.name"),
    phone: t("checkout.phone"),
    city: t("checkout.city"),
    npOffice: t("checkout.npOffice"),
    comment: t("checkout.comment"),
    paymentTitle: t("checkout.paymentTitle"),
    paymentMono: t("checkout.paymentMono"),
    paymentCod: t("checkout.paymentCod"),
    submit: t("checkout.submit"),
    submitting: t("checkout.submitting"),
    summaryTitle: t("checkout.summaryTitle"),
    total: t("cart.total"),
    empty: t("cart.empty"),
    emptyCta: t("cart.emptyCta"),
    errorRequired: t("checkout.errorRequired"),
    errorPhone: t("checkout.errorPhone"),
    errorSubmit: t("checkout.errorSubmit"),
    errorOutOfStock: t("checkout.errorOutOfStock"),
    errorUnknownProduct: t("checkout.errorUnknownProduct"),
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <CheckoutForm locale={locale} labels={labels} />
    </div>
  );
}
