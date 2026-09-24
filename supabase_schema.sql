-- ==============================================================================
-- UMA FOOTWEARS - Production Supabase PostgreSQL Database Schema
-- Run this complete script in your Supabase Project -> SQL Editor -> Click 'Run'
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. PRODUCTS TABLE
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  wholesale_price numeric(10,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  stock integer not null default 0,
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '["6","7","8","9","10","11"]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Safe migration if products table already exists
alter table public.products add column if not exists sizes jsonb not null default '["6","7","8","9","10","11"]'::jsonb;

-- 3. SALES TRANSACTIONS TABLE
create table if not exists public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  bill_no text unique not null,
  timestamp timestamptz default now(),
  customer_name text,
  customer_phone text,
  payment_mode text not null check (payment_mode in ('Cash', 'UPI', 'Split', 'Card')),
  subtotal numeric(10,2) not null default 0,
  total_discount numeric(10,2) not null default 0,
  final_amount numeric(10,2) not null default 0,
  split_details jsonb, -- { "cash": 500, "upi": 500 }
  staff_username text not null default 'staff',
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Safe migration if sales_transactions already exists
alter table public.sales_transactions add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- 4. TRANSACTION LINE ITEMS TABLE
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.sales_transactions(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_code text not null,       -- Stores product catalog code (e.g. N22-BX1260)
  brand text not null default '',   -- Stores product category/brand (e.g. WALKARO)
  color text not null default '',
  size text not null default '',
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null,
  discounted_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  wholesale_price numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Safe migration if transaction_items table already exists
alter table public.transaction_items add column if not exists size text not null default '';
alter table public.transaction_items add column if not exists brand text not null default '';
alter table public.transaction_items add column if not exists type text not null default '';
alter table public.transaction_items alter column product_id drop not null;
alter table public.transaction_items drop constraint if exists transaction_items_product_id_fkey;
alter table public.transaction_items add constraint transaction_items_product_id_fkey foreign key (product_id) references public.products(id) on delete set null;

-- 5. SHOP SETTINGS TABLE
create table if not exists public.shop_settings (
  id integer primary key default 1,
  shop_name text not null default 'UMA FOOTWEARS',
  tagline text not null default 'where every steps matters',
  address text not null default 'No. 45, Commercial Market Complex, Main Road, Chennai - 600001',
  phone text not null default '+91 98765 43210 / 044-23456789',
  gstin text default '33ABCDE1234F1Z5',
  footer_message text not null default 'Thank you for shopping at UMA FOOTWEARS! Goods once sold can be exchanged within 7 days with valid receipt.',
  ledger_columns jsonb default '["billNoDate","pNo","articleNo","mrp","soldPrice","brand","type","wholeSalePct","wholeSaleValue","sizeAvailable","payment"]'::jsonb,
  custom_columns jsonb default '[]'::jsonb,
  column_labels jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Safe migration if shop_settings already exists
alter table public.shop_settings add column if not exists ledger_columns jsonb default '["billNoDate","pNo","articleNo","mrp","soldPrice","brand","type","wholeSalePct","wholeSaleValue","sizeAvailable","payment"]'::jsonb;
alter table public.shop_settings add column if not exists custom_columns jsonb default '[]'::jsonb;
alter table public.shop_settings add column if not exists column_labels jsonb default '{}'::jsonb;

-- Apply the correct column order to any existing row (run this to fix existing deployments)
UPDATE public.shop_settings
SET
  ledger_columns = '["billNoDate","pNo","articleNo","mrp","soldPrice","brand","type","wholeSalePct","wholeSaleValue","sizeAvailable","payment"]'::jsonb,
  column_labels = '{}'::jsonb,
  updated_at = now()
WHERE id = 1;


-- Ensure only 1 row exists for shop_settings
insert into public.shop_settings (id, shop_name, tagline, address, phone, gstin, footer_message)
values (
  1,
  'UMA FOOTWEARS',
  'where every steps matters',
  'No. 45, Commercial Market Complex, Main Road, Chennai - 600001',
  '+91 98765 43210 / 044-23456789',
  '33ABCDE1234F1Z5',
  'Thank you for shopping at UMA FOOTWEARS! Goods once sold can be exchanged within 7 days with valid receipt.'
)
on conflict (id) do update set
  tagline = excluded.tagline;

-- 6. ATOMIC TRANSACTION & STOCK DEDUCTION PROCEDURE
create or replace function public.process_sale_transaction(
  p_bill_no text,
  p_customer_name text,
  p_customer_phone text,
  p_payment_mode text,
  p_subtotal numeric,
  p_total_discount numeric,
  p_final_amount numeric,
  p_split_details jsonb,
  p_staff_username text,
  p_items jsonb
) returns uuid as $$
declare
  v_tx_id uuid;
  item record;
begin
  -- 1. Insert Master Transaction Record
  insert into public.sales_transactions (
    bill_no, customer_name, customer_phone, payment_mode,
    subtotal, total_discount, final_amount, split_details, staff_username
  ) values (
    p_bill_no, p_customer_name, p_customer_phone, p_payment_mode,
    p_subtotal, p_total_discount, p_final_amount, p_split_details, p_staff_username
  ) returning id into v_tx_id;

  -- 2. Insert items and decrement stock atomically
  for item in select * from jsonb_to_recordset(p_items) as x(
    productId uuid, productName text, productCode text, brand text, color text, size text,
    quantity int, price numeric, discountedPrice numeric, totalPrice numeric, wholesalePrice numeric
  ) loop
    insert into public.transaction_items (
      transaction_id, product_id, product_name, product_code, brand,
      color, size, quantity, price, discounted_price, total_price, wholesale_price
    ) values (
      v_tx_id, item.productId, item.productName, item.productCode, coalesce(item.brand, ''),
      coalesce(item.color, ''), coalesce(item.size, ''), item.quantity, item.price, item.discountedPrice, item.totalPrice, coalesce(item.wholesalePrice, 0)
    );

    if item.productId is not null then
      update public.products
      set stock = greatest(0, stock - item.quantity),
          updated_at = now()
      where id = item.productId;
    end if;
  end loop;

  return v_tx_id;
end;
$$ language plpgsql security definer;

-- 7. INITIAL FOOTWEAR CATALOG SEEDING (39 Products)
insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
values
  ('N1-WU1020', 'WALKARO WU1020', 'WALKARO', 629, 415.14, 0, 1, '[{"name": "Standard"}]'::jsonb, '["10"]'::jsonb),
  ('N1-1721G', 'PARAGON 1721G', 'PARAGON', 205, 143.5, 0, 1, '[{"name": "Standard"}]'::jsonb, '["9"]'::jsonb),
  ('N2-X PRO', 'APL X PRO', 'APL', 399.9, 271.93, 0, 5, '[{"name": "Standard"}]'::jsonb, '["8","9","10"]'::jsonb),
  ('N3-JC1150', 'JIVERS JC1150', 'JIVERS', 239, 167.3, 0, 1, '[{"name": "Standard"}]'::jsonb, '["8"]'::jsonb),
  ('N4-1129G', 'PARAGON 1129G', 'PARAGON', 177, 123.9, 0, 1, '[{"name": "Standard"}]'::jsonb, '["10"]'::jsonb),
  ('N6-BX1256', 'WALKARO BX1256', 'WALKARO', 224.5, 157.15, 0, 2, '[{"name": "Standard"}]'::jsonb, '["8","9"]'::jsonb),
  ('N7-GP4077', 'VKC GP4077', 'VKC', 309, 203.94, 0, 8, '[{"name": "Standard"}]'::jsonb, '["7","8","9","10"]'::jsonb),
  ('N8-WG5007', 'WALKARO WG5007', 'WALKARO', 269, 177.54, 0, 2, '[{"name": "Standard"}]'::jsonb, '["8"]'::jsonb),
  ('N9-TYPE 1', 'AIR FAX TYPE 1', 'AIR FAX', 485, 300.7, 0, 2, '[{"name": "Standard"}]'::jsonb, '["7","8"]'::jsonb),
  ('N10-T2055', 'ODYSSIA TUFA T2055', 'ODYSSIA TUFA', 699, 475.32, 0, 3, '[{"name": "Standard"}]'::jsonb, '["9","10"]'::jsonb),
  ('N11-3325', 'MARK 3325', 'MARK', 339, 223.74, 0, 2, '[{"name": "Standard"}]'::jsonb, '["7","10"]'::jsonb),
  ('N12-WG5002', 'WALKARO WG5002', 'WALKARO', 299, 194.35, 0, 7, '[{"name": "Standard"}]'::jsonb, '["6","7","8"]'::jsonb),
  ('N13-GM5511', 'WALKARO GM5511', 'WALKARO', 249, 161.85, 0, 5, '[{"name": "Standard"}]'::jsonb, '["7","8","9","10"]'::jsonb),
  ('N14-WGR50044', 'WALKARO WGR50044', 'WALKARO', 309, 200.85, 0, 1, '[{"name": "Standard"}]'::jsonb, '["8"]'::jsonb),
  ('N15-GP4216', 'VKC GP4216', 'VKC', 279, 184.14, 0, 3, '[{"name": "Standard"}]'::jsonb, '["7","10"]'::jsonb),
  ('N17-SFG4018', 'SPARX SFG4018', 'SPARX', 399.5, 271.66, 0, 3, '[{"name": "Standard"}]'::jsonb, '["8","9","10"]'::jsonb),
  ('N18-W1030', 'WALKARO W1030', 'WALKARO', 309, 200.85, 0, 1, '[{"name": "Standard"}]'::jsonb, '["9"]'::jsonb),
  ('N20-GP4203', 'VKC GP4203', 'VKC', 279, 184.14, 0, 2, '[{"name": "Standard"}]'::jsonb, '["9","10"]'::jsonb),
  ('N22-BX1260', 'WALKARO BX1260', 'WALKARO', 259.5, 168.68, 0, 6, '[{"name": "Standard"}]'::jsonb, '["7","8","9","10"]'::jsonb),
  ('N23-BG1410', 'AQUALITE BG1410', 'AQUALITE', 349.5, 244.65, 0, 2, '[{"name": "Standard"}]'::jsonb, '["9","10"]'::jsonb),
  ('N24-LP1042', 'VKC LP1042', 'VKC', 339, 223.74, 0, 3, '[{"name": "Standard"}]'::jsonb, '["6","7","9"]'::jsonb),
  ('N26-1753G', 'PARAGON 1753G', 'PARAGON', 229.5, 160.65, 0, 13, '[{"name": "Standard"}]'::jsonb, '["6","7","8","9","10"]'::jsonb),
  ('N26-AL621P', 'AQUALITE AL621P', 'AQUALITE', 279.5, 195.65, 0, 2, '[{"name": "Standard"}]'::jsonb, '["8","9"]'::jsonb),
  ('N27-BER1', 'BERSACHE BER1', 'BERSACHE', 300, 195, 0, 2, '[{"name": "Standard"}]'::jsonb, '["7","10"]'::jsonb),
  ('N28-GP4551', 'VKC GP4551', 'VKC', 316, 208.56, 0, 5, '[{"name": "Standard"}]'::jsonb, '["8","9","10"]'::jsonb),
  ('N29-WC8767', 'WALKARO WC8767', 'WALKARO', 379, 246.35, 0, 2, '[{"name": "Standard"}]'::jsonb, '["7","10"]'::jsonb),
  ('N30-WGB53232', 'WALKARO WGB53232', 'WALKARO', 269.5, 188.65, 0, 6, '[{"name": "Standard"}]'::jsonb, '["7","8","9","10"]'::jsonb),
  ('N32-GP4258', 'VKC GP4258', 'VKC', 359, 236.94, 0, 5, '[{"name": "Standard"}]'::jsonb, '["7","8","9","10"]'::jsonb),
  ('N33-WG5661', 'WALKARO WG5661', 'WALKARO', 384, 249.6, 0, 3, '[{"name": "Standard"}]'::jsonb, '["6","8","10"]'::jsonb),
  ('N34-DG9163', 'VKC DG9163', 'VKC', 319, 210.54, 0, 2, '[{"name": "Standard"}]'::jsonb, '["7","8"]'::jsonb),
  ('N35-WGR53383', 'WALKARO WGR53383', 'WALKARO', 299, 194.35, 0, 3, '[{"name": "Standard"}]'::jsonb, '["8","10"]'::jsonb),
  ('N37-GP4103', 'VKC GP4103', 'VKC', 259, 170.94, 0, 2, '[{"name": "Standard"}]'::jsonb, '["8"]'::jsonb),
  ('N38-NV35', 'AEROWALK NV35', 'AEROWALK', 369, 254.61, 0, 2, '[{"name": "Standard"}]'::jsonb, '["8"]'::jsonb),
  ('N40-WS9132', 'WALKARO WS9132', 'WALKARO', 1099, 549.5, 0, 1, '[{"name": "Standard"}]'::jsonb, '["8"]'::jsonb),
  ('N42-ASICS', 'ADUTE ASICS', 'ADUTE', 600, 390, 0, 1, '[{"name": "Standard"}]'::jsonb, '["10"]'::jsonb),
  ('N43-137', 'NAYASHA 137', 'NAYASHA', 550, 335.5, 0, 10, '[{"name": "Standard"}]'::jsonb, '["6","7","8","9","10"]'::jsonb),
  ('N44-DG55152', 'VKC DG55152', 'VKC', 799, 519.35, 0, 3, '[{"name": "Standard"}]'::jsonb, '["7","8","10"]'::jsonb),
  ('N46-CAPTAIN13', 'ASIAN CAPTAIN13', 'ASIAN', 649, 395.89, 0, 2, '[{"name": "Standard"}]'::jsonb, '["6","9"]'::jsonb),
  ('N48-ATI', 'ADUTE ATI', 'ADUTE', 650, 422.5, 0, 2, '[{"name": "Standard"}]'::jsonb, '["10"]'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  wholesale_price = excluded.wholesale_price,
  stock = excluded.stock,
  sizes = excluded.sizes;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
alter table public.products enable row level security;
alter table public.sales_transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.shop_settings enable row level security;

-- Allow public read/write access with the Anon Key for simple POS operational deployment
-- (You can later restrict this via Supabase Auth policies if desired)
create policy "Allow all actions on products" on public.products for all using (true) with check (true);
create policy "Allow all actions on sales_transactions" on public.sales_transactions for all using (true) with check (true);
create policy "Allow all actions on transaction_items" on public.transaction_items for all using (true) with check (true);
create policy "Allow all actions on shop_settings" on public.shop_settings for all using (true) with check (true);

-- 9. ENABLE SUPABASE REALTIME REPLICATION (For live stock, transactions & settings updates across devices)
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales_transactions;
alter publication supabase_realtime add table public.transaction_items;
alter publication supabase_realtime add table public.shop_settings;

