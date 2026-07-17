"use client";

import { useEffect, useState } from "react";

// Нестандартизованное событие Chrome/Android — в lib.dom его типа нет.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/**
 * Кнопка «Установить приложение» внизу мобильного меню (см. спеку PWA).
 * - Android/Chrome: ловим beforeinstallprompt и по клику открываем системный
 *   диалог установки. Событие не пришло (уже установлено / не поддерживается) —
 *   кнопка не рендерится вовсе.
 * - iOS Safari: события не существует; если сайт открыт не в standalone-режиме,
 *   показываем кнопку, по клику — подсказку «Поделиться → На экран "Домой"».
 * Fail-soft: до/без JS ничего не рендерится, меню выглядит как раньше.
 */
export default function InstallApp({ label, iosHint }: { label: string; iosHint: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS-специфичное поле, в типах Navigator его нет.
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt && !isIos) return null;

  return (
    <div className="mt-1 border-t border-blush/40 pt-2">
      <button
        type="button"
        onClick={() => (prompt ? prompt.prompt() : setShowHint((v) => !v))}
        className="flex w-full items-center gap-2 rounded-full bg-blush/60 px-4 py-2 text-sm font-semibold text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        {label}
      </button>
      {showHint && <p className="px-4 py-2 text-xs text-ink/70">{iosHint}</p>}
    </div>
  );
}
