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
  created_at timestamptz default now()
);

-- 4. TRANSACTION LINE ITEMS TABLE
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.sales_transactions(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_code text not null,
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

-- 5. SHOP SETTINGS TABLE
create table if not exists public.shop_settings (
  id integer primary key default 1,
  shop_name text not null default 'UMA FOOTWEARS',
  tagline text not null default 'where every steps matters',
  address text not null default 'No. 45, Commercial Market Complex, Main Road, Chennai - 600001',
  phone text not null default '+91 98765 43210 / 044-23456789',
  gstin text default '33ABCDE1234F1Z5',
  footer_message text not null default 'Thank you for shopping at UMA FOOTWEARS! Goods once sold can be exchanged within 7 days with valid receipt.',
  updated_at timestamptz default now()
);

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
    productId uuid, productName text, productCode text, color text, size text,
    quantity int, price numeric, discountedPrice numeric, totalPrice numeric, wholesalePrice numeric
  ) loop
    insert into public.transaction_items (
      transaction_id, product_id, product_name, product_code,
      color, size, quantity, price, discounted_price, total_price, wholesale_price
    ) values (
      v_tx_id, item.productId, item.productName, item.productCode,
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

-- 7. INITIAL FOOTWEAR CATALOG SEEDING (Only if table is empty)
insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
select 
  'UMA-SP-01', 'Air Sprint Sports Running Shoes', 'Sports', 1899, 1150, 10, 45,
  '[{"name": "Black/Red", "hex": "#ef4444"}, {"name": "Navy Blue", "hex": "#1e3a8a"}, {"name": "All Black", "hex": "#09090b"}, {"name": "Grey/Neon", "hex": "#84cc16"}]'::jsonb,
  '["6", "7", "8", "9", "10", "11"]'::jsonb
where not exists (select 1 from public.products where code = 'UMA-SP-01');

insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
select 
  'UMA-FM-02', 'Classic Genuine Leather Oxford', 'Formal', 2499, 1550, 15, 30,
  '[{"name": "Tan Brown", "hex": "#78350f"}, {"name": "Jet Black", "hex": "#18181b"}, {"name": "Cherry Wood", "hex": "#451a03"}]'::jsonb,
  '["6", "7", "8", "9", "10", "11"]'::jsonb
where not exists (select 1 from public.products where code = 'UMA-FM-02');

insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
select 
  'UMA-SN-03', 'Urban Street Canvas Sneakers', 'Casual', 1299, 780, 10, 60,
  '[{"name": "Pure White", "hex": "#f8fafc"}, {"name": "Olive Green", "hex": "#3f6212"}, {"name": "Midnight Black", "hex": "#0f172a"}]'::jsonb,
  '["6", "7", "8", "9", "10"]'::jsonb
where not exists (select 1 from public.products where code = 'UMA-SN-03');

insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
select 
  'UMA-SD-04', 'Comfort Grip Leather Sandals', 'Sandals', 999, 580, 5, 50,
  '[{"name": "Dark Brown", "hex": "#582f0e"}, {"name": "Tan", "hex": "#9a7b56"}, {"name": "Black", "hex": "#18181b"}]'::jsonb,
  '["6", "7", "8", "9", "10"]'::jsonb
where not exists (select 1 from public.products where code = 'UMA-SD-04');

insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
select 
  'UMA-FF-05', 'Soft Cushion Daily Flip Flops', 'Slippers', 399, 210, 0, 100,
  '[{"name": "Royal Blue", "hex": "#2563eb"}, {"name": "Teal", "hex": "#0d9488"}, {"name": "Graphite Grey", "hex": "#4b5563"}]'::jsonb,
  '["5", "6", "7", "8", "9", "10"]'::jsonb
where not exists (select 1 from public.products where code = 'UMA-FF-05');

insert into public.products (code, name, category, price, wholesale_price, discount_percent, stock, colors, sizes)
select 
  'UMA-HL-06', 'Elegance Block Heel Pumps', 'Women', 1599, 920, 12, 35,
  '[{"name": "Rose Gold", "hex": "#fb7185"}, {"name": "Metallic Silver", "hex": "#cbd5e1"}, {"name": "Matte Black", "hex": "#27272a"}]'::jsonb,
  '["4", "5", "6", "7", "8"]'::jsonb
where not exists (select 1 from public.products where code = 'UMA-HL-06');

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

-- 9. ENABLE SUPABASE REALTIME REPLICATION (For live stock updates across devices)
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales_transactions;
