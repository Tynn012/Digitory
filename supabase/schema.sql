create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  slug text unique not null,
  description text,
  price numeric(10,2),
  category text,
  featured boolean default false,
  thumbnail text,
  images jsonb default '[]'::jsonb,
  tags text[] default array[]::text[],
  digital_file_url text,
  metadata jsonb default '{}'::jsonb
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  product_id uuid references products(id) on delete set null,
  product_slug text,
  product_title text,
  amount numeric(10,2),
  customer_name text,
  gcash_reference text,
  proof_url text,
  status text default 'pending',
  paid_at timestamptz,
  download_unlocked boolean default false,
  metadata jsonb default '{}'::jsonb
);

create table if not exists branding (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  site_name text,
  hero_title text,
  hero_subtitle text,
  logo_url text,
  accent_primary text,
  accent_secondary text,
  metadata jsonb default '{}'::jsonb
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_products_updated_at
before update on products
for each row
execute procedure set_updated_at();

create trigger set_orders_updated_at
before update on orders
for each row
execute procedure set_updated_at();

create trigger set_branding_updated_at
before update on branding
for each row
execute procedure set_updated_at();

alter table products enable row level security;
alter table orders enable row level security;
alter table branding enable row level security;

create policy "Products are viewable by everyone"
  on products for select
  using (true);

create policy "Products are editable by authenticated"
  on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Orders can be created by anyone"
  on orders for insert
  with check (true);

create policy "Orders are viewable by authenticated"
  on orders for select
  using (auth.role() = 'authenticated');

create policy "Orders are editable by authenticated"
  on orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Orders are deletable by authenticated"
  on orders for delete
  using (auth.role() = 'authenticated');

create policy "Branding is viewable by everyone"
  on branding for select
  using (true);

create policy "Branding is editable by authenticated"
  on branding for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
