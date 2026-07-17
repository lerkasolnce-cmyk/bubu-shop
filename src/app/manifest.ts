import type { MetadataRoute } from "next";

// PWA-манифест (Next отдаёт его как /manifest.webmanifest и сам линкует в <head>).
// Цвета = токены бренда из globals.css: --color-cream. Сервис-воркера нет
// сознательно — для магазина кэш опаснее пользы (см. спеку 2026-07-17-pwa-design).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bu-bu — дитячий магазин",
    short_name: "bu-bu",
    description: "Дитячі коляски, автокрісла та товари для малюків в Одесі",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#fbf7f0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
