# bu-bu shop

Інтернет-магазин дитячих товарів (Next.js 16 App Router + Supabase). Каталог з фільтрами та пошуком, кошик, оформлення замовлення з оплатою monopay або накладеним платежем, сповіщення в Telegram, адмін-панель для товарів/категорій/замовлень з CSV-імпортом, мультимовність (UA/RU/IT/EN) з автоперерахунком цін у EUR для італійської локалі.

## Локальний запуск

```bash
npm install
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000). Без налаштованого `.env.local` сайт працює в демо-режимі (тестові дані в пам'яті, без Supabase) — зручно для перегляду верстки, але кошик/замовлення/адмінка не працюють.

## Налаштування Supabase

1. Створіть проект на [supabase.com](https://supabase.com).
2. Відкрийте **SQL Editor** → вставте вміст `supabase/migrations/001_schema.sql` → **Run**. Це створить таблиці `categories`, `products`, `orders`, увімкне RLS-політики та storage bucket `products` для фото товарів.
3. Там само виконайте `supabase/migrations/002_locales_eur.sql` (після 001) — додає колонки `name_it`/`name_en`/`description_it`/`description_en` у `products` та `eur_rate`/`total_eur` у `orders` (для локалі IT: ціни в EUR за курсом НБУ, зафіксованим на момент замовлення; грн лишається основною валютою).
4. **ОБОВ'ЯЗКОВО: Authentication → Sign In / Up → Email → вимкніть "Enable Sign Ups".**

   > ⚠️ **Без цього кроку будь-хто зможе самостійно зареєструватися** і, оскільки RLS-політики адмінських таблиць перевіряють лише `auth.role() = 'authenticated'` (тобто "залогінений хтось", а не "конкретний адмін"), отримає доступ до читання замовлень (ПІБ, телефон, адреса клієнтів) і запису товарів/категорій. Вимкнення публічної реєстрації — єдиний бар'єр проти цього.

5. У **Authentication → Users** створіть єдиного адмін-користувача вручну (email/пароль, кнопка "Add user") — під ним заходьте в адмін-панель: `/admin/login` (без сесії всі `/admin/*` редіректять на логін).
6. У **Project Settings → API** скопіюйте `Project URL`, `anon public` ключ і `service_role` ключ у `.env.local` (див. таблицю нижче).

### Заповнення каталогу

Тестові дані:

```bash
npx tsx scripts/seed.ts
```

Скрипт ідемпотентний (upsert по `slug`) — можна запускати повторно. Успішний запуск виводить `seeded 5 categories, 52 products`.

Або імпортуйте свій асортимент через CSV у адмінці: `/admin/import` (шаблон — посилання "Завантажити шаблон CSV" на цій сторінці, `public/import-template.csv`).

## Деплой на Vercel

1. Імпортуйте репозиторій на [vercel.com/new](https://vercel.com/new).
2. У налаштуваннях проєкту (**Settings → Environment Variables**) додайте всі змінні з таблиці нижче.
3. **`NEXT_PUBLIC_SITE_URL` обов'язково має включати схему `https://`** (напр. `https://bubu-shop.vercel.app`), інакше `new URL(SITE_URL)` у `src/app/layout.tsx` (поле `metadataBase`) впаде з помилкою при білді/рендері.
4. Задеплойте. Перший live-платіж через monopay обов'язково перевірте вручну на проді (тестового режиму monobank для цього недостатньо).

## Оплата monopay

1. У [кабінеті монобанк еквайрингу](https://acp.monobank.ua) отримайте `MONOBANK_TOKEN`.
2. Отримайте `MONO_PUB_KEY` (потрібен для перевірки підпису вебхука):
   ```bash
   curl -H "X-Token: <MONOBANK_TOKEN>" https://api.monobank.ua/api/merchant/pubkey
   ```
3. Зареєструйте webhook URL у кабінеті монобанку: `https://<ваш-домен>/api/mono-webhook`.
4. Перший реальний платіж на проді перевірте вручну (статус замовлення, надходження в Telegram/адмінку).

## Telegram-сповіщення про нові замовлення

1. Створіть бота через [@BotFather](https://t.me/BotFather) → отримаєте `TELEGRAM_BOT_TOKEN`.
2. Дізнайтесь свій chat id через [@userinfobot](https://t.me/userinfobot) → `TELEGRAM_CHAT_ID`.
3. Без цих змінних сповіщення просто пропускаються (замовлення все одно створюється).

## Керування товарами

Адмін-панель: `/admin/login` → після входу:

- `/admin/products` — список/редагування товарів, `/admin/products/new` — новий товар.
- `/admin/categories` — категорії.
- `/admin/orders` — замовлення, `/admin/orders/[id]` — деталі замовлення.
- `/admin/import` — масовий CSV-імпорт товарів (шаблон на сторінці).

**Ціни вводяться тільки в UAH.** Для локалі IT (італомовні відвідувачі) ціна в EUR розраховується автоматично за курсом НБУ (з кешем на 1 годину) — вручну EUR не вводиться і в БД не зберігається (окрім `eur_rate`/`total_eur`, зафіксованих на конкретному замовленні в момент оплати).

## Змінні середовища

| Змінна | Призначення |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL із Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon public` ключ (клієнтський, публічний) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` ключ — секретний, тільки сервер, ніколи в git (`.env.local` вже в `.gitignore`) |
| `MONOBANK_TOKEN` | Токен monopay-еквайрингу з кабінету монобанку |
| `MONO_PUB_KEY` | Публічний ключ монобанку для перевірки підпису вебхука (`GET /api/merchant/pubkey`) |
| `TELEGRAM_BOT_TOKEN` | Токен бота від @BotFather |
| `TELEGRAM_CHAT_ID` | Chat id для сповіщень, від @userinfobot |
| `NEXT_PUBLIC_SITE_URL` | Публічна адреса сайту, **обов'язково з `https://`** (redirect/webhook URL-и monopay, `metadataBase`, sitemap/robots) |
| `EUR_UAH_FALLBACK_RATE` | Резервний курс EUR/UAH, якщо запит до НБУ не вдався (за замовчуванням `48`, якщо не задано) |
