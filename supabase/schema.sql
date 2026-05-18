drop schema if exists public cascade;
create schema public;

-- Required extension
create extension if not exists "pgcrypto";

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  slug text unique not null,
  description text,
  price numeric(10,2),
  category text,
  archived boolean default false,
  featured boolean default false,
  thumbnail text,
  images jsonb default '[]'::jsonb,
  tags text[] default array[]::text[],
  digital_file_url text,
  metadata jsonb default '{}'::jsonb
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  product_id uuid references public.products(id) on delete set null,
  product_slug text,
  product_title text,
  amount numeric(10,2),
  customer_name text,
  buyer_email text,
  gcash_reference text,
  proof_url text,
  status text default 'pending',
  paid_at timestamptz,
  download_unlocked boolean default false,
  download_token text unique,
  download_url text,
  payment_method text default 'manual_gcash',
  receipt_sent_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

-- Branding
create table if not exists public.branding (
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

-- Indexes
create unique index if not exists orders_download_token_idx on public.orders (download_token);

-- Trigger helper to set updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_products_updated_at
before update on public.products
for each row
execute procedure public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute procedure public.set_updated_at();

create trigger set_branding_updated_at
before update on public.branding
for each row
execute procedure public.set_updated_at();

-- Grants required for REST API access (RLS still applies)
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Ensure future tables/functions inherit the same privileges
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant execute on functions
  to anon, authenticated, service_role;

-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.branding enable row level security;

-- Policies
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

drop policy if exists "Products are editable by admins" on public.products;
drop policy if exists "Products are editable by authenticated users" on public.products;
create policy "Products are editable by authenticated users"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Orders can be created by anyone" on public.orders;
create policy "Orders can be created by anyone"
  on public.orders for insert
  with check (true);

drop policy if exists "Orders are viewable by admins" on public.orders;
drop policy if exists "Orders are viewable by authenticated users" on public.orders;
create policy "Orders are viewable by authenticated users"
  on public.orders for select
  using (auth.role() = 'authenticated');

drop policy if exists "Orders are editable by admins" on public.orders;
drop policy if exists "Orders are editable by authenticated users" on public.orders;
create policy "Orders are editable by authenticated users"
  on public.orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Orders are deletable by admins" on public.orders;
drop policy if exists "Orders are deletable by authenticated users" on public.orders;
create policy "Orders are deletable by authenticated users"
  on public.orders for delete
  using (auth.role() = 'authenticated');

drop policy if exists "Branding is viewable by everyone" on public.branding;
create policy "Branding is viewable by everyone"
  on public.branding for select
  using (true);

drop policy if exists "Branding is editable by admins" on public.branding;
drop policy if exists "Branding is editable by authenticated users" on public.branding;
create policy "Branding is editable by authenticated users"
  on public.branding for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage buckets used by the app
insert into storage.buckets (id, name, public)
values
  ('product-media', 'product-media', true),
  ('product-files', 'product-files', true),
  ('order-proofs', 'order-proofs', true)
on conflict (id) do update
set public = excluded.public;

-- Storage policies: allow authenticated admin users to insert/update objects in the buckets
drop policy if exists "Admins can manage product media" on storage.objects;
drop policy if exists "Authenticated users can manage product media" on storage.objects;
create policy "Authenticated users can manage product media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-media')
  with check (bucket_id = 'product-media');

drop policy if exists "Admins can manage product files" on storage.objects;
drop policy if exists "Authenticated users can manage product files" on storage.objects;
create policy "Authenticated users can manage product files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-files')
  with check (bucket_id = 'product-files');

drop policy if exists "Public can insert order proofs" on storage.objects;
create policy "Public can insert order proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'order-proofs');

drop policy if exists "Public can update order proofs" on storage.objects;
create policy "Public can update order proofs"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'order-proofs')
  with check (bucket_id = 'order-proofs');


