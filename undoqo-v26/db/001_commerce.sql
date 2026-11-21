-- Apply in Supabase SQL Editor. No browser access to financial tables.
create extension if not exists pgcrypto;
create table if not exists public.customers (
 id uuid primary key default gen_random_uuid(), email text not null unique, full_name text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key, receipt_token_hash text not null,
 customer_id uuid not null references public.customers(id),
 status text not null default 'pending' check(status in ('pending','paid','failed','refunded')),
 total_zar numeric(12,2) not null check(total_zar>0),
 total_usd numeric(12,2) not null check(total_usd>0),
 usd_per_zar numeric(18,10) not null check(usd_per_zar>0),
 fx_quoted_at timestamptz not null default now(),
 paypal_order_id text unique, paypal_capture_id text unique,
 customer_notes text not null default '',
 created_at timestamptz not null default now(), paid_at timestamptz,
 constraint no_paid_without_capture check(status <> 'paid' or (paypal_capture_id is not null and paid_at is not null))
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 product_id text not null, title text not null, kind text not null check(kind in ('book','consultation','course')),
 unit_price_zar numeric(12,2) not null, quantity integer not null check(quantity between 1 and 50),
 unique(order_id,product_id)
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 provider text not null default 'paypal', provider_order_id text not null, provider_capture_id text not null unique,
 currency text not null check(currency='USD'), amount numeric(12,2) not null,
 captured_at timestamptz not null default now(), raw_status text not null default 'COMPLETED',
 unique(provider_order_id,provider_capture_id)
);
create sequence if not exists public.stu_invoice_seq;
create table if not exists public.invoices (
 id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id),
 invoice_number text not null unique, kind text not null default 'paid_receipt',
 issued_at timestamptz not null default now(), currency text not null default 'ZAR',
 amount_zar numeric(12,2) not null, amount_usd numeric(12,2) not null
);
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 product_id text not null, status text not null default 'awaiting_scheduling',
 scheduled_at timestamptz, created_at timestamptz not null default now(),
 unique(order_id,product_id)
);
create table if not exists public.digital_entitlements (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 customer_id uuid not null references public.customers(id), product_id text not null,
 status text not null default 'pending_asset' check(status in ('pending_asset','active','revoked')),
 created_at timestamptz not null default now(), unique(order_id,product_id)
);
create table if not exists public.paypal_webhook_events (
 event_id text primary key, event_type text not null, received_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.bookings enable row level security;
alter table public.digital_entitlements enable row level security;
alter table public.paypal_webhook_events enable row level security;
-- No anon/authenticated grants: database is accessed only from secure Netlify Functions.
revoke all on public.customers,public.orders,public.order_items,public.payments,public.invoices,public.bookings,public.digital_entitlements,public.paypal_webhook_events from anon,authenticated;

-- One transaction: customer + order + all frozen order items.
create or replace function public.commerce_create_order(p_order_id uuid,p_receipt_token_hash text,p_name text,p_email text,p_notes text,p_items jsonb,p_zar numeric,p_usd numeric,p_rate numeric)
returns void language plpgsql security invoker set search_path=public as $$
declare v_customer uuid; v_item jsonb;
begin
 if p_name is null or length(p_name)>120 or p_email is null or length(p_email)>180 or jsonb_array_length(p_items)=0 then raise exception 'Invalid order'; end if;
 insert into public.customers(email,full_name) values(lower(p_email),p_name)
 on conflict(email) do update set full_name=excluded.full_name,updated_at=now()
 returning id into v_customer;
 insert into public.orders(id,receipt_token_hash,customer_id,total_zar,total_usd,usd_per_zar,customer_notes)
 values(p_order_id,p_receipt_token_hash,v_customer,p_zar,p_usd,p_rate,coalesce(p_notes,''));
 for v_item in select value from jsonb_array_elements(p_items) loop
 insert into public.order_items(order_id,product_id,title,kind,unit_price_zar,quantity)
 values(p_order_id,v_item->>'id',v_item->>'title',v_item->>'kind',(v_item->>'unit_price_zar')::numeric,(v_item->>'quantity')::integer);
 end loop;
end $$;

-- A single transaction is responsible for payment, invoice, bookings and entitlements.
-- Only the server (service role) can execute it. Duplicate callbacks are no-ops.
create or replace function public.commerce_finalize_capture(p_order_id uuid,p_paypal_order_id text,p_capture_id text,p_amount numeric,p_currency text)
returns text language plpgsql security invoker set search_path=public as $$
declare v_order public.orders%rowtype; v_item public.order_items%rowtype; v_number text;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_order.paypal_order_id is distinct from p_paypal_order_id then raise exception 'PayPal order mismatch'; end if;
 if p_currency<>'USD' or v_order.total_usd<>p_amount then raise exception 'Payment amount mismatch'; end if;
 if v_order.status='paid' then
   if v_order.paypal_capture_id=p_capture_id then return (select invoice_number from public.invoices where order_id=p_order_id); end if;
   raise exception 'Already paid using different capture';
 end if;
 if v_order.status<>'pending' then raise exception 'Order not pending'; end if;
 update public.orders set status='paid',paypal_capture_id=p_capture_id,paid_at=now() where id=p_order_id;
 insert into public.payments(order_id,provider_order_id,provider_capture_id,currency,amount) values(p_order_id,p_paypal_order_id,p_capture_id,'USD',p_amount);
 v_number:='STU-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.stu_invoice_seq')::text,6,'0');
 insert into public.invoices(order_id,invoice_number,amount_zar,amount_usd) values(p_order_id,v_number,v_order.total_zar,v_order.total_usd);
 for v_item in select * from public.order_items where order_id=p_order_id loop
  if v_item.kind='consultation' then
   insert into public.bookings(order_id,product_id) values(p_order_id,v_item.product_id) on conflict do nothing;
  else
   insert into public.digital_entitlements(order_id,customer_id,product_id,status)
   values(p_order_id,v_order.customer_id,v_item.product_id,'pending_asset') on conflict do nothing;
  end if;
 end loop;
 return v_number;
end $$;
revoke execute on function public.commerce_create_order(uuid,text,text,text,text,jsonb,numeric,numeric,numeric) from public,anon,authenticated;
revoke execute on function public.commerce_finalize_capture(uuid,text,text,numeric,text) from public,anon,authenticated;
grant execute on function public.commerce_create_order(uuid,text,text,text,text,jsonb,numeric,numeric,numeric) to service_role;
grant execute on function public.commerce_finalize_capture(uuid,text,text,numeric,text) to service_role;
