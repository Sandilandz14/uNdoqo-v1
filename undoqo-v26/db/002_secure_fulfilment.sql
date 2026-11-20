-- V2.6 migration: run only after 001_commerce.sql.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('undoqo-digital-library','undoqo-digital-library',false,52428800,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create table if not exists public.digital_assets (
 product_id text primary key, storage_path text not null unique,
 display_name text not null, enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 constraint safe_pdf_path check(storage_path ~ '^[A-Za-z0-9][A-Za-z0-9_./-]*\.pdf$' and storage_path !~ '(^|/)\.\.?(/|$)')
);
alter table public.digital_assets enable row level security;
revoke all on public.digital_assets from anon,authenticated;
create or replace function public.commerce_activate_asset(p_product_id text)
returns integer language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 if not exists(select 1 from public.digital_assets where product_id=p_product_id and enabled) then raise exception 'Asset not enabled'; end if;
 update public.digital_entitlements e set status='active' from public.orders o
 where e.order_id=o.id and o.status='paid' and e.product_id=p_product_id and e.status='pending_asset';
 get diagnostics n=row_count; return n;
end $$;
revoke execute on function public.commerce_activate_asset(text) from public,anon,authenticated;
grant execute on function public.commerce_activate_asset(text) to service_role;
create or replace function public.commerce_mark_refunded(p_order_id uuid,p_capture_id text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare v public.orders%rowtype;
begin
 select * into v from public.orders where id=p_order_id for update;
 if not found or v.paypal_capture_id is distinct from p_capture_id then raise exception 'Capture mismatch'; end if;
 if v.status='refunded' then return false; end if;
 if v.status<>'paid' then raise exception 'Not paid'; end if;
 update public.orders set status='refunded' where id=p_order_id;
 update public.digital_entitlements set status='revoked' where order_id=p_order_id;
 return true;
end $$;
revoke execute on function public.commerce_mark_refunded(uuid,text) from public,anon,authenticated;
grant execute on function public.commerce_mark_refunded(uuid,text) to service_role;

-- Updated payment finaliser: new purchases activate only if their licensed asset is enabled.
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
   values(p_order_id,v_order.customer_id,v_item.product_id,case when exists (select 1 from public.digital_assets a where a.product_id=v_item.product_id and a.enabled) then 'active' else 'pending_asset' end) on conflict do nothing;
  end if;
 end loop;
 return v_number;
end $$;
revoke execute on function public.commerce_finalize_capture(uuid,text,text,numeric,text) from public,anon,authenticated;
grant execute on function public.commerce_finalize_capture(uuid,text,text,numeric,text) to service_role;
