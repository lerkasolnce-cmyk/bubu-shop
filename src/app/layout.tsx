import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartProvider from "@/components/CartProvider";
import CursorParticles from "@/components/CursorParticles";
import { getLocale } from "@/lib/i18n";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DEFAULT_DESCRIPTION = "bu-bu — інтернет-магазин дитячих колясок в Одесі: Anex, Cybex, Espiro. Доставка Новою Поштою по Україні.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s — bu-bu",
    default: "bu-bu — інтернет-магазин дитячих колясок",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    siteName: "bu-bu",
    type: "website",
    description: DEFAULT_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const htmlLang: Record<typeof locale, string> = { ua: "uk", ru: "ru", it: "it", en: "en" };

  return (
    <html
      lang={htmlLang[locale]}
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <CursorParticles />
        <CartProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
