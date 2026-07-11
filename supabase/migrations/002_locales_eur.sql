-- Task 16: IT/EN locales + EUR display pricing.
-- UAH stays the one true business currency (products.price, orders.total,
-- monopay amounts are always UAH) — these columns only add optional IT/EN
-- content translations and a per-order snapshot of the NBU rate used to
-- display EUR to 'it'-locale shoppers at checkout time.
alter table products add column name_it text;
alter table products add column name_en text;
alter table products add column description_it text default '';
alter table products add column description_en text default '';

alter table orders add column eur_rate numeric;
alter table orders add column total_eur numeric;
