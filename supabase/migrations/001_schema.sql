create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ua text not null, name_ru text not null,
  parent_id uuid references categories(id) on delete set null,
  sort int default 0
);
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ua text not null, name_ru text not null,
  description_ua text default '', description_ru text default '',
  brand text not null,
  category_id uuid references categories(id) on delete set null,
  price int not null check (price >= 0),
  old_price int,
  stock_status text not null default 'in_stock'
    check (stock_status in ('in_stock','preorder','out_of_stock')),
  specs jsonb default '{}',
  images text[] default '{}',
  is_hit boolean default false, is_sale boolean default false,
  created_at timestamptz default now()
);
create index on products (category_id);
create index on products (brand);
create index on products (price);
create index on products (is_hit) where is_hit;
create extension if not exists pg_trgm;
create index products_name_trgm on products using gin ((name_ua || ' ' || name_ru) gin_trgm_ops);
create table orders (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  name text not null, phone text not null,
  city text not null, np_office text default '', comment text default '',
  items jsonb not null,          -- [{slug,name,price,qty}] снапшот на момент заказа
  total int not null,
  payment_method text not null check (payment_method in ('mono','cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','n/a')),
  order_status text not null default 'new'
    check (order_status in ('new','confirmed','shipped','done','cancelled')),
  mono_invoice_id text
);
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "admin write categories" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin read orders" on orders for select using (auth.role() = 'authenticated');
create policy "admin update orders" on orders for update using (auth.role() = 'authenticated');
-- insert заказов только через service key (API route), публичной insert-политики нет
insert into storage.buckets (id, name, public) values ('products','products', true);
create policy "public read product images" on storage.objects for select using (bucket_id = 'products');
create policy "admin upload product images" on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');
create policy "admin delete product images" on storage.objects for delete
  using (bucket_id = 'products' and auth.role() = 'authenticated');
