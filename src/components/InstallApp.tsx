"use client";

import { useEffect, useState } from "react";

// Нестандартизованное событие Chrome/Android — в lib.dom его типа нет.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

// Chrome шлёт beforeinstallprompt ОДИН раз и рано; компонент в закрытом
// мобильном меню в этот момент ещё не смонтирован и событие пропустил бы.
// Поэтому ловим его на уровне модуля (выполняется при загрузке клиентского
// бандла) и раздаём уже смонтированным/будущим компонентам через подписку.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<(e: BeforeInstallPromptEvent) => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    subscribers.forEach((fn) => fn(deferredPrompt!));
  });
}

/**
 * Кнопка «Установить приложение» (см. спеку PWA).
 * - Chrome/Edge (Android и десктоп): ловим beforeinstallprompt, по клику СРАЗУ
 *   открываем системный диалог установки. События нет (уже установлено /
 *   браузер не умеет) — кнопка не рендерится вовсе.
 * - iOS Safari: программная установка запрещена Apple; если сайт открыт не в
 *   standalone-режиме, по клику показываем подсказку «Поделиться → На экран».
 *
 * variant="menu"   — строка в мобильном меню (iOS-подсказка поддерживается);
 * variant="header" — компактная пилюля в шапке десктопа, видна только с md и
 *   только когда установка реально доступна (prompt пришёл) — на iOS/Safari
 *   десктопе её нет, там нечего запускать.
 * Fail-soft: до/без JS ничего не рендерится.
 */
export default function InstallApp({
  label,
  iosHint,
  variant = "menu",
}: {
  label: string;
  iosHint: string;
  variant?: "menu" | "header";
}) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Событие могло прийти до монтирования (см. модульный перехват выше) —
    // берём сохранённое; на будущее подписываемся, если оно ещё впереди.
    if (deferredPrompt) setPrompt(deferredPrompt);
    const onPrompt = (e: BeforeInstallPromptEvent) => setPrompt(e);
    subscribers.add(onPrompt);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS-специфичное поле, в типах Navigator его нет.
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);

    return () => {
      subscribers.delete(onPrompt);
    };
  }, []);

  const icon = (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );

  if (variant === "header") {
    if (!prompt) return null;
    return (
      <button
        type="button"
        onClick={() => prompt.prompt()}
        className="hidden shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/85 md:flex"
      >
        {icon}
        {label}
      </button>
    );
  }

  if (!prompt && !isIos) return null;

  return (
    <div className="mt-1 border-t border-blush/40 pt-2">
      <button
        type="button"
        onClick={() => (prompt ? prompt.prompt() : setShowHint((v) => !v))}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent/85"
      >
        {icon}
        {label}
      </button>
      {showHint && <p className="px-4 py-2 text-center text-xs text-ink/70">{iosHint}</p>}
    </div>
  );
}
