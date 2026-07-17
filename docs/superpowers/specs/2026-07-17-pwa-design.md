# PWA для bubu-shop — дизайн

**Дата:** 2026-07-17. **Цель:** сайт устанавливается на телефон как приложение (иконка на домашнем экране, открытие без адресной строки). Без сторов, без отдельного кода, без service worker.

## Компоненты

### 1. Манифест — `src/app/manifest.ts`
Штатный metadata-route Next.js (отдаёт `/manifest.webmanifest`, линкуется автоматически):
- `name: "bu-bu — дитячий магазин"`, `short_name: "bu-bu"`
- `display: "standalone"`, `start_url: "/"`, `scope: "/"`
- `background_color` / `theme_color`: кремовый фон сайта (значение `--color-cream` из `globals.css`)
- `icons`: 192 и 512 (`purpose: any`) + 512 maskable

### 2. Иконки — `public/icons/`
`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` (180×180).
Дизайн = шапка сайта: надпись «bu-bu» тем же шрифтом в розовой «пилюле» (blush) на кремовом фоне. Maskable — та же композиция с запасом по краям (безопасная зона 80%). Генерация: отрисовка канвасом из реальных CSS-токенов сайта (не AI-генерация). Одноразовый артефакт — скрипт в репозиторий не кладём, только готовые PNG.

### 3. Метаданные iOS — `src/app/layout.tsx`
В существующий `metadata` добавить `appleWebApp: { capable: true, title: "bu-bu", statusBarStyle: "default" }` и `icons.apple` → apple-touch-icon. iOS игнорирует манифест, ему нужны эти теги.

### 4. Кнопка «Установить приложение» — в `MobileMenu.tsx`
Клиентский компонент `InstallApp` внизу мобильного меню:
- **Android/Chrome:** ловим `beforeinstallprompt`, показываем кнопку, по клику — системный диалог. Если событие не пришло (уже установлено/не поддерживается) — кнопки нет.
- **iOS Safari:** событие не существует; если `navigator.standalone !== true`, показываем кнопку, по клику — короткая подсказка «Поделиться → На екран "Домой"».
- Тексты — 4 локали в словарях `dict.{ua,ru,it,en}.json` (ключи `install.*`, наборы идентичны).

## Ошибки / крайние случаи
- Уже установлено: Android — `beforeinstallprompt` не приходит, кнопка не рендерится; iOS standalone — скрыта по `navigator.standalone`.
- Desktop: кнопка живёт только в мобильном меню — десктоп не трогаем.
- Fail-soft как везде: без JS-событий меню просто выглядит как раньше.

## Тесты
- Unit (vitest): manifest.ts отдаёт корректную структуру (имя/иконки/display); словари содержат ключи `install.*` во всех 4 локалях (существующий тест идентичности наборов покроет автоматически).
- Ручная проверка: Lighthouse installability на превью; DOM-проверка `<link rel="manifest">` и apple-теги.

## Вне скоупа
Service worker/офлайн, push-уведомления, публикация в Google Play/App Store.
