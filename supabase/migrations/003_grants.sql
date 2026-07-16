-- Новые проекты Supabase (2026+) не выдают автоматических table-грантов API-ролям
-- для таблиц, созданных в SQL Editor. RLS-политики (001) остаются основным барьером;
-- здесь — минимальные гранты, чтобы PostgREST вообще пускал роли к таблицам.
grant usage on schema public to anon, authenticated, service_role;

-- каталог: читают все, пишет админ (authenticated) и service_role
grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant all on public.categories, public.products to service_role;

-- заказы: создаёт только сервер (service_role), админ читает и меняет статус
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;

-- identity-колонка orders.id — вставляющей роли нужен доступ к sequence
grant usage, select on all sequences in schema public to service_role;
