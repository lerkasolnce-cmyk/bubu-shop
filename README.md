This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Налаштування Supabase

1. Створіть проект на [supabase.com](https://supabase.com).
2. Відкрийте **SQL Editor** → вставте вміст `supabase/migrations/001_schema.sql` → **Run**. Це створить таблиці `categories`, `products`, `orders`, увімкне RLS-політики та storage bucket `products` для фото товарів.
3. У **Project Settings → API** скопіюйте `Project URL`, `anon public` ключ і `service_role` ключ.
4. Створіть файл `.env.local` в корені проєкту:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   SUPABASE_SERVICE_ROLE_KEY=xxxxx
   ```
   `SUPABASE_SERVICE_ROLE_KEY` — секретний ключ, ніколи не використовується в клієнтському коді і не потрапляє в git (`.env.local` вже в `.gitignore`).
5. У **Authentication → Users** створіть адмін-користувача (email/пароль) — під ним адмінка (Task 10+) буде заходити в панель керування.
6. Заповніть базу тестовими товарами:
   ```
   npx tsx scripts/seed.ts
   ```
   Скрипт ідемпотентний (upsert по `slug`) — можна запускати повторно. Успішний запуск виводить `seeded 5 categories, 52 products`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
