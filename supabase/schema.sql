create extension if not exists "pgcrypto";

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text default 'admin',
  created_at timestamptz default now()
);

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

alter table orders add column if not exists buyer_email text;
alter table orders add column if not exists download_token text;
alter table orders add column if not exists download_url text;
alter table orders add column if not exists payment_method text default 'manual_gcash';
alter table orders add column if not exists receipt_sent_at timestamptz;

create unique index if not exists orders_download_token_idx
  on orders (download_token);

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

insert into products (
  title,
  slug,
  description,
  price,
  category,
  featured,
  thumbnail,
  images,
  tags,
  digital_file_url,
  metadata
)
select *
from (
  values
    (
      'Budget Glow Sheet',
      'budget-glow-sheet',
      'A clean monthly budget spreadsheet with cashflow summaries and goal tracking tabs.',
      249,
      'Budget Templates',
      true,
      'https://placehold.co/800x600/e6fff8/0f1c20?text=Budget+Glow',
      '["https://placehold.co/1200x800/e6fff8/0f1c20?text=Budget+Glow","https://placehold.co/1200x800/fff7e6/0f1c20?text=Budget+Overview"]'::jsonb,
      array['budget', 'monthly', 'spreadsheet'],
      '',
      '{"format":"xlsx","pages":12}'::jsonb
    ),
    (
      'Weekly Focus Planner',
      'weekly-focus-planner',
      'Plan your week with time blocks, priorities, and a review zone to stay aligned.',
      199,
      'Productivity Sheets',
      true,
      'https://placehold.co/800x600/ffe9e0/0f1c20?text=Weekly+Focus',
      '["https://placehold.co/1200x800/ffe9e0/0f1c20?text=Weekly+Focus","https://placehold.co/1200x800/e6fff8/0f1c20?text=Priority+Lanes"]'::jsonb,
      array['weekly', 'planning', 'focus'],
      '',
      '{"format":"pdf","pages":6}'::jsonb
    ),
    (
      'Monthly Cashflow Dashboard',
      'monthly-cashflow-dashboard',
      'Track income streams, subscriptions, and savings with month-over-month insights.',
      349,
      'Finance Trackers',
      true,
      'https://placehold.co/800x600/e8f2ff/0f1c20?text=Cashflow+Dashboard',
      '["https://placehold.co/1200x800/e8f2ff/0f1c20?text=Cashflow+Dashboard","https://placehold.co/1200x800/e6fff8/0f1c20?text=Income+Split"]'::jsonb,
      array['finance', 'dashboard', 'cashflow'],
      '',
      '{"format":"xlsx","pages":7}'::jsonb
    ),
    (
      'Client Invoice Pack',
      'client-invoice-pack',
      'Professional invoice, quote, and payment reminder templates for client work.',
      279,
      'Printable Assets',
      false,
      'https://placehold.co/800x600/ffe9e0/0f1c20?text=Invoice+Pack',
      '["https://placehold.co/1200x800/ffe9e0/0f1c20?text=Invoice+Pack","https://placehold.co/1200x800/e8f2ff/0f1c20?text=Quote+Template"]'::jsonb,
      array['invoice', 'freelance', 'business'],
      '',
      '{"format":"pdf","pages":14}'::jsonb
    ),
    (
      'Notion Reading Vault',
      'notion-reading-vault',
      'A reading and highlights tracker with note capture, ratings, and yearly stats.',
      189,
      'Study Planners',
      false,
      'https://placehold.co/800x600/e8f2ff/0f1c20?text=Reading+Vault',
      '["https://placehold.co/1200x800/e8f2ff/0f1c20?text=Reading+Vault","https://placehold.co/1200x800/e6fff8/0f1c20?text=Highlights+Board"]'::jsonb,
      array['notion', 'reading', 'knowledge'],
      '',
      '{"format":"notion","pages":1}'::jsonb
    )
) as sample(
  title,
  slug,
  description,
  price,
  category,
  featured,
  thumbnail,
  images,
  tags,
  digital_file_url,
  metadata
)
where not exists (select 1 from products)
on conflict (slug) do nothing;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$ language sql stable;

alter table products enable row level security;
alter table orders enable row level security;
alter table branding enable row level security;
alter table admin_users enable row level security;

create policy "Products are viewable by everyone"
  on products for select
  using (true);

create policy "Products are editable by admins"
  on products for all
  using (is_admin())
  with check (is_admin());

create policy "Orders can be created by anyone"
  on orders for insert
  with check (true);

create policy "Orders are viewable by admins"
  on orders for select
  using (is_admin());

create policy "Orders are editable by admins"
  on orders for update
  using (is_admin())
  with check (is_admin());

create policy "Orders are deletable by admins"
  on orders for delete
  using (is_admin());

create policy "Branding is viewable by everyone"
  on branding for select
  using (true);

create policy "Branding is editable by admins"
  on branding for all
  using (is_admin())
  with check (is_admin());

create policy "Admin users can view themselves"
  on admin_users for select
  using (user_id = auth.uid());
