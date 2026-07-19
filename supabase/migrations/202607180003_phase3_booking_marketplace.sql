begin;

do $$ begin
  if to_regclass('public.workspace_products') is null then
    raise exception 'Phase 2 is required. Run 202607180002_phase2_operator_management.sql first.';
  end if;
end $$;

do $$ begin create type public.booking_hold_status as enum ('ACTIVE','CONVERTED','EXPIRED','RELEASED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.booking_status as enum ('PAYMENT_PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','REFUND_PENDING','REFUNDED','NO_SHOW'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('PENDING','SUCCESS','FAILED','REFUND_PENDING','REFUNDED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_provider as enum ('SIMULATED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.notification_type as enum ('BOOKING_CONFIRMED','BOOKING_CANCELLED','BOOKING_CHECKED_IN','BOOKING_COMPLETED','BOOKING_NO_SHOW','REFUND_PROCESSED','GENERAL'); exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists phone text;
alter table public.operators add column if not exists commission_rate numeric(5,2) not null default 15;
do $$ begin alter table public.operators add constraint operators_commission_rate_range check (commission_rate between 0 and 100); exception when duplicate_object then null; end $$;

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
  operator_id uuid not null references public.operators(id), location_id uuid not null references public.locations(id),
  workspace_product_id uuid not null references public.workspace_products(id), inventory_unit_id uuid references public.inventory_units(id),
  product_type public.workspace_product_type not null, booking_date date, start_time time, end_time time,
  start_date date, end_date date, quantity integer not null default 1 check (quantity > 0),
  pricing_snapshot jsonb not null default '{}', subtotal numeric(12,2) not null check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0), security_deposit numeric(12,2) not null default 0 check (security_deposit >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0), total_amount numeric(12,2) not null check (total_amount >= 0),
  operator_earnings numeric(12,2) not null check (operator_earnings >= 0), expires_at timestamptz not null,
  status public.booking_hold_status not null default 'ACTIVE', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(), booking_reference text not null unique,
  customer_id uuid not null references public.profiles(id), operator_id uuid not null references public.operators(id),
  location_id uuid not null references public.locations(id), workspace_product_id uuid not null references public.workspace_products(id),
  inventory_unit_id uuid references public.inventory_units(id), product_type public.workspace_product_type not null,
  booking_date date, start_time time, end_time time, start_date date, end_date date,
  quantity integer not null default 1 check (quantity > 0), pricing_snapshot jsonb not null default '{}',
  subtotal numeric(12,2) not null check (subtotal >= 0), tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  security_deposit numeric(12,2) not null default 0 check (security_deposit >= 0), platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0), operator_earnings numeric(12,2) not null check (operator_earnings >= 0),
  status public.booking_status not null default 'PAYMENT_PENDING', payment_status public.payment_status not null default 'PENDING',
  checked_in_at timestamptz, completed_at timestamptz, cancelled_at timestamptz, cancellation_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id), amount numeric(12,2) not null check (amount >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0), tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  security_deposit numeric(12,2) not null default 0 check (security_deposit >= 0), platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  operator_earnings numeric(12,2) not null check (operator_earnings >= 0), status public.payment_status not null default 'PENDING',
  provider public.payment_provider not null default 'SIMULATED', provider_reference text, paid_at timestamptz, refunded_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null default 'GENERAL', title text not null, message text not null,
  entity_type text, entity_id uuid, is_read boolean not null default false, created_at timestamptz not null default now()
);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  previous_status public.booking_status, new_status public.booking_status not null, changed_by uuid references public.profiles(id),
  reason text, created_at timestamptz not null default now()
);

create trigger booking_holds_updated_at before update on public.booking_holds for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

create index booking_holds_product_active_idx on public.booking_holds(workspace_product_id, status, expires_at);
create index booking_holds_inventory_active_idx on public.booking_holds(inventory_unit_id, status, expires_at) where inventory_unit_id is not null;
create index booking_holds_expiry_idx on public.booking_holds(expires_at) where status = 'ACTIVE';
create index bookings_customer_idx on public.bookings(customer_id, created_at desc);
create index bookings_operator_idx on public.bookings(operator_id, created_at desc);
create index bookings_location_idx on public.bookings(location_id, created_at desc);
create index bookings_status_idx on public.bookings(status);
create index bookings_payment_status_idx on public.bookings(payment_status);
create index bookings_booking_date_idx on public.bookings(booking_date);
create index bookings_start_date_idx on public.bookings(start_date);
create index bookings_product_type_idx on public.bookings(product_type);
create index notifications_unread_idx on public.notifications(user_id, created_at desc) where not is_read;
create index booking_history_idx on public.booking_status_history(booking_id, created_at);

-- Returns normalized request and server-calculated pricing. Monthly ranges are inclusive;
-- meeting-room end times are exclusive. Callers hold a product advisory lock.
create or replace function public.validate_booking_request(p_product_id uuid, p_request jsonb, p_ignore_hold uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  product record; target_date date; range_start date; range_end date; start_at time; end_at time;
  qty integer := 1; months_count integer := 1; duration_minutes numeric; subtotal numeric(12,2);
  tax numeric(12,2); fee numeric(12,2); earnings numeric(12,2); total numeric(12,2);
  target_inventory uuid; reserved integer := 0; buffer_minutes integer := 0; slot_minutes integer := 0;
begin
  select wp.*, l.operator_id, l.timezone, o.commission_rate into product
  from public.workspace_products wp join public.locations l on l.id = wp.location_id
  join public.operators o on o.id = l.operator_id
  where wp.id = p_product_id and wp.status = 'ACTIVE' and l.status = 'ACTIVE'
    and l.review_status = 'APPROVED' and l.is_published and o.status = 'ACTIVE';
  if not found then raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE'; end if;

  if product.type = 'DAY_PASS' then
    target_date := nullif(p_request->>'bookingDate','')::date; qty := coalesce((p_request->>'quantity')::integer,1);
    if target_date is null or target_date < (now() at time zone product.timezone)::date or qty < 1
      or (product.maximum_booking_quantity is not null and qty > product.maximum_booking_quantity) then
      raise exception using errcode = '22023', message = 'INVALID_BOOKING_REQUEST';
    end if;
    if not exists(select 1 from public.availability_schedules s where s.workspace_product_id = product.id and s.day_of_week = extract(isodow from target_date)::int-1 and s.is_available) then
      raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE';
    end if;
    select coalesce(sum(x.quantity),0)::int into reserved from (
      select b.quantity from public.bookings b where b.workspace_product_id=product.id and b.booking_date=target_date and b.status in ('CONFIRMED','CHECKED_IN')
      union all select h.quantity from public.booking_holds h where h.workspace_product_id=product.id and h.booking_date=target_date and h.status='ACTIVE' and h.expires_at>now() and h.id is distinct from p_ignore_hold
    ) x;
    if reserved + qty > product.capacity then raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE'; end if;
    subtotal := round(product.price * qty,2);
  elsif product.type = 'MEETING_ROOM' then
    target_date := nullif(p_request->>'bookingDate','')::date; start_at := nullif(p_request->>'startTime','')::time;
    end_at := nullif(p_request->>'endTime','')::time; qty := coalesce((p_request->>'attendees')::integer,1);
    qty := coalesce((p_request->>'attendees')::integer,(p_request->>'quantity')::integer,1);
    duration_minutes := extract(epoch from (end_at-start_at))/60; buffer_minutes := coalesce((product.configuration->>'bufferMinutes')::integer,0);
    slot_minutes := coalesce((product.configuration->>'slotIntervalMinutes')::integer,0);
    if target_date is null or start_at is null or end_at is null or target_date < (now() at time zone product.timezone)::date
      or start_at >= end_at or qty < 1 or qty > product.capacity or duration_minutes < coalesce(product.minimum_booking_minutes,1)
      or (slot_minutes > 0 and (extract(epoch from start_at)::integer/60) % slot_minutes <> 0) then
      raise exception using errcode = '22023', message = 'INVALID_BOOKING_REQUEST';
    end if;
    if not exists(select 1 from public.availability_schedules s where s.workspace_product_id=product.id and s.day_of_week=extract(isodow from target_date)::int-1 and s.is_available and start_at>=s.opens_at and end_at<=s.closes_at)
      or not exists(select 1 from public.location_operating_hours h where h.location_id=product.location_id and h.day_of_week=extract(isodow from target_date)::int-1 and h.is_open and start_at>=h.opens_at and end_at<=h.closes_at) then
      raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE';
    end if;
    if exists(select 1 from public.bookings b where b.workspace_product_id=product.id and b.booking_date=target_date and b.status in ('CONFIRMED','CHECKED_IN')
      and b.start_time < end_at + make_interval(mins=>buffer_minutes) and b.end_time > start_at - make_interval(mins=>buffer_minutes))
      or exists(select 1 from public.booking_holds h where h.workspace_product_id=product.id and h.booking_date=target_date and h.status='ACTIVE' and h.expires_at>now() and h.id is distinct from p_ignore_hold
      and h.start_time < end_at + make_interval(mins=>buffer_minutes) and h.end_time > start_at - make_interval(mins=>buffer_minutes)) then
      raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE';
    end if;
    subtotal := round(product.price * duration_minutes / 60,2);
  elsif product.type = 'DEDICATED_DESK' then
    range_start := nullif(p_request->>'startDate','')::date; months_count := coalesce((p_request->>'months')::integer,0);
    target_inventory := nullif(p_request->>'inventoryUnitId','')::uuid;
    if range_start is null or range_start < (now() at time zone product.timezone)::date or months_count < coalesce(product.minimum_tenure_months,1) or target_inventory is null then
      raise exception using errcode = '22023', message = 'INVALID_BOOKING_REQUEST'; end if;
    range_end := (range_start + make_interval(months=>months_count))::date - 1;
    if not exists(select 1 from public.inventory_units i where i.id=target_inventory and i.workspace_product_id=product.id and i.status='AVAILABLE' and coalesce(i.available_from,product.available_from,range_start)<=range_start)
      or exists(select 1 from public.bookings b where b.inventory_unit_id=target_inventory and b.status in ('CONFIRMED','CHECKED_IN') and b.start_date<=range_end and b.end_date>=range_start)
      or exists(select 1 from public.booking_holds h where h.inventory_unit_id=target_inventory and h.status='ACTIVE' and h.expires_at>now() and h.id is distinct from p_ignore_hold and h.start_date<=range_end and h.end_date>=range_start) then
      raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE'; end if;
    subtotal := round(product.price * months_count,2);
  else
    range_start := nullif(p_request->>'startDate','')::date; months_count := coalesce((p_request->>'months')::integer,0); qty := coalesce((p_request->>'teamSize')::integer,(p_request->>'quantity')::integer,1);
    if range_start is null or range_start < (now() at time zone product.timezone)::date or months_count < coalesce(product.minimum_tenure_months,1) or qty<1 or qty>product.capacity or coalesce(product.available_from,range_start)>range_start then
      raise exception using errcode = '22023', message = 'INVALID_BOOKING_REQUEST'; end if;
    range_end := (range_start + make_interval(months=>months_count))::date - 1;
    if exists(select 1 from public.bookings b where b.workspace_product_id=product.id and b.status in ('CONFIRMED','CHECKED_IN') and b.start_date<=range_end and b.end_date>=range_start)
      or exists(select 1 from public.booking_holds h where h.workspace_product_id=product.id and h.status='ACTIVE' and h.expires_at>now() and h.id is distinct from p_ignore_hold and h.start_date<=range_end and h.end_date>=range_start) then
      raise exception using errcode = 'P0001', message = 'WORKSPACE_NOT_AVAILABLE'; end if;
    subtotal := round(product.price * months_count,2);
  end if;
  tax := round(subtotal*.18,2); fee := round(subtotal*product.commission_rate/100,2);
  earnings := subtotal-fee; total := subtotal+tax+case when product.type in ('DEDICATED_DESK','PRIVATE_CABIN') then product.security_deposit else 0 end;
  return jsonb_build_object('operatorId',product.operator_id,'locationId',product.location_id,'productType',product.type,
    'productName',product.name,'unitPrice',product.price,'bookingDate',target_date,'startTime',start_at,'endTime',end_at,
    'startDate',range_start,'endDate',range_end,'quantity',qty,'months',months_count,'inventoryUnitId',target_inventory,
    'subtotal',subtotal,'taxAmount',tax,'securityDeposit',case when product.type in ('DEDICATED_DESK','PRIVATE_CABIN') then product.security_deposit else 0 end,
    'platformFee',fee,'operatorEarnings',earnings,'totalAmount',total,'taxRate',18,'commissionRate',product.commission_rate);
end $$;

create or replace function public.create_booking_hold(p_product_id uuid, p_request jsonb) returns public.booking_holds
language plpgsql security definer set search_path = '' as $$
declare price jsonb; result public.booking_holds; uid uuid := auth.uid();
begin
  if not exists(select 1 from public.profiles p where p.id=uid and p.role='CUSTOMER' and p.is_active) then raise exception using errcode='42501',message='CUSTOMER_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text,0));
  update public.booking_holds set status='EXPIRED' where status='ACTIVE' and expires_at<=now();
  price := public.validate_booking_request(p_product_id,p_request,null);
  insert into public.booking_holds(customer_id,operator_id,location_id,workspace_product_id,inventory_unit_id,product_type,booking_date,start_time,end_time,start_date,end_date,quantity,
    pricing_snapshot,subtotal,tax_amount,security_deposit,platform_fee,total_amount,operator_earnings,expires_at)
  values(uid,(price->>'operatorId')::uuid,(price->>'locationId')::uuid,p_product_id,nullif(price->>'inventoryUnitId','')::uuid,(price->>'productType')::public.workspace_product_type,
    nullif(price->>'bookingDate','')::date,nullif(price->>'startTime','')::time,nullif(price->>'endTime','')::time,nullif(price->>'startDate','')::date,nullif(price->>'endDate','')::date,
    (price->>'quantity')::integer,price,(price->>'subtotal')::numeric,(price->>'taxAmount')::numeric,(price->>'securityDeposit')::numeric,(price->>'platformFee')::numeric,
    (price->>'totalAmount')::numeric,(price->>'operatorEarnings')::numeric,now()+interval '10 minutes') returning * into result;
  return result;
end $$;

create or replace function public.confirm_simulated_booking(p_hold_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare hold public.booking_holds; result public.bookings; ref text; uid uuid:=auth.uid(); price jsonb; operator_user uuid;
begin
  select * into hold from public.booking_holds where id=p_hold_id for update;
  if not found or hold.customer_id<>uid then raise exception using errcode='42501',message='HOLD_NOT_AVAILABLE'; end if;
  if hold.status<>'ACTIVE' or hold.expires_at<=now() then
    if hold.status='ACTIVE' then update public.booking_holds set status='EXPIRED' where id=hold.id; end if;
    raise exception using errcode='P0001',message='HOLD_EXPIRED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(hold.workspace_product_id::text,0));
  price := public.validate_booking_request(hold.workspace_product_id,hold.pricing_snapshot,hold.id);
  ref := 'OPS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.bookings(booking_reference,customer_id,operator_id,location_id,workspace_product_id,inventory_unit_id,product_type,booking_date,start_time,end_time,start_date,end_date,quantity,
    pricing_snapshot,subtotal,tax_amount,security_deposit,platform_fee,total_amount,operator_earnings,status,payment_status)
  values(ref,hold.customer_id,hold.operator_id,hold.location_id,hold.workspace_product_id,hold.inventory_unit_id,hold.product_type,hold.booking_date,hold.start_time,hold.end_time,hold.start_date,hold.end_date,hold.quantity,
    hold.pricing_snapshot,hold.subtotal,hold.tax_amount,hold.security_deposit,hold.platform_fee,hold.total_amount,hold.operator_earnings,'CONFIRMED','SUCCESS') returning * into result;
  insert into public.payments(booking_id,customer_id,amount,subtotal,tax_amount,security_deposit,platform_fee,operator_earnings,status,provider,provider_reference,paid_at)
  values(result.id,uid,hold.total_amount,hold.subtotal,hold.tax_amount,hold.security_deposit,hold.platform_fee,hold.operator_earnings,'SUCCESS','SIMULATED','SIM-'||replace(gen_random_uuid()::text,'-',''),now());
  update public.booking_holds set status='CONVERTED' where id=hold.id;
  insert into public.booking_status_history(booking_id,new_status,changed_by,reason) values(result.id,'CONFIRMED',uid,'Simulated payment confirmed');
  insert into public.notifications(user_id,type,title,message,entity_type,entity_id) values(uid,'BOOKING_CONFIRMED','Booking confirmed',ref||' is confirmed.','booking',result.id);
  for operator_user in select lm.user_id from public.location_members lm join public.profiles p on p.id=lm.user_id where lm.location_id=hold.location_id and lm.is_active and p.is_active loop
    insert into public.notifications(user_id,type,title,message,entity_type,entity_id) values(operator_user,'BOOKING_CONFIRMED','New confirmed booking',ref||' is ready for your team.','booking',result.id);
  end loop;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(uid,'BOOKING_CONFIRMED','booking',result.id,jsonb_build_object('booking_reference',ref,'provider','SIMULATED'));
  return result;
end $$;

create or replace function public.release_booking_hold(p_hold_id uuid) returns public.booking_holds
language plpgsql security definer set search_path = '' as $$
declare result public.booking_holds; begin
  update public.booking_holds set status=case when expires_at<=now() then 'EXPIRED' else 'RELEASED' end
  where id=p_hold_id and customer_id=auth.uid() and status='ACTIVE' returning * into result;
  if not found then raise exception using errcode='P0001',message='HOLD_NOT_AVAILABLE'; end if; return result;
end $$;

create or replace function public.transition_operator_booking(p_booking_id uuid,p_status public.booking_status,p_reason text default null) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare result public.bookings; old_status public.booking_status; notice_type public.notification_type; notice_title text;
begin
  select status into old_status from public.bookings where id=p_booking_id and location_id in(select public.current_user_location_ids()) for update;
  if not found or not exists(select 1 from public.profiles where id=auth.uid() and role='OPERATOR_ADMIN' and is_active) then raise exception using errcode='42501',message='BOOKING_NOT_AVAILABLE'; end if;
  if not ((old_status='CONFIRMED' and p_status in('CHECKED_IN','NO_SHOW')) or (old_status='CHECKED_IN' and p_status='COMPLETED')) then raise exception using errcode='P0001',message='INVALID_STATUS_TRANSITION'; end if;
  if p_status='NO_SHOW' and length(trim(coalesce(p_reason,'')))<3 then raise exception using errcode='22023',message='REASON_REQUIRED'; end if;
  update public.bookings set status=p_status,checked_in_at=case when p_status='CHECKED_IN' then now() else checked_in_at end,
    completed_at=case when p_status='COMPLETED' then now() else completed_at end where id=p_booking_id returning * into result;
  insert into public.booking_status_history(booking_id,previous_status,new_status,changed_by,reason) values(p_booking_id,old_status,p_status,auth.uid(),nullif(trim(p_reason),''));
  notice_type:=case p_status when 'CHECKED_IN' then 'BOOKING_CHECKED_IN' when 'COMPLETED' then 'BOOKING_COMPLETED' else 'BOOKING_NO_SHOW' end;
  notice_title:=case p_status when 'CHECKED_IN' then 'Checked in' when 'COMPLETED' then 'Booking completed' else 'Marked as no-show' end;
  insert into public.notifications(user_id,type,title,message,entity_type,entity_id) values(result.customer_id,notice_type,notice_title,result.booking_reference||' was updated.','booking',result.id);
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'BOOKING_'||p_status,'booking',result.id,jsonb_build_object('booking_reference',result.booking_reference));
  return result;
end $$;

create or replace function public.cancel_booking(p_booking_id uuid,p_reason text) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare result public.bookings; old_status public.booking_status; actor_role public.user_role; operator_user uuid; starts_at timestamptz; location_timezone text;
begin
  select role into actor_role from public.profiles where id=auth.uid() and is_active;
  select * into result from public.bookings where id=p_booking_id for update;
  if not found or result.status<>'CONFIRMED' or actor_role not in('CUSTOMER','OPERATOR_ADMIN') then raise exception using errcode='P0001',message='CANCELLATION_NOT_ALLOWED'; end if;
  if actor_role='CUSTOMER' then
    if result.customer_id<>auth.uid() then raise exception using errcode='42501',message='BOOKING_NOT_AVAILABLE'; end if;
    select timezone into location_timezone from public.locations where id=result.location_id;
    starts_at:=case when result.booking_date is not null then (result.booking_date+coalesce(result.start_time,time '23:59')) at time zone location_timezone else result.start_date::timestamp at time zone location_timezone end;
    if starts_at<=now() then raise exception using errcode='P0001',message='CANCELLATION_NOT_ALLOWED'; end if;
  elsif result.location_id not in(select public.current_user_location_ids()) then raise exception using errcode='42501',message='BOOKING_NOT_AVAILABLE'; end if;
  if length(trim(coalesce(p_reason,'')))<3 then raise exception using errcode='22023',message='REASON_REQUIRED'; end if;
  old_status:=result.status;
  update public.bookings set status='REFUNDED',payment_status='REFUNDED',cancelled_at=now(),cancellation_reason=trim(p_reason) where id=p_booking_id returning * into result;
  update public.payments set status='REFUNDED',refunded_at=now() where booking_id=p_booking_id;
  insert into public.booking_status_history(booking_id,previous_status,new_status,changed_by,reason) values(p_booking_id,old_status,'CANCELLED',auth.uid(),trim(p_reason));
  insert into public.booking_status_history(booking_id,previous_status,new_status,changed_by,reason) values(p_booking_id,'CANCELLED','REFUND_PENDING',auth.uid(),'Simulated refund started');
  insert into public.booking_status_history(booking_id,previous_status,new_status,changed_by,reason) values(p_booking_id,'REFUND_PENDING','REFUNDED',auth.uid(),'Simulated refund completed');
  insert into public.notifications(user_id,type,title,message,entity_type,entity_id) values(result.customer_id,'REFUND_PROCESSED','Refund processed',result.booking_reference||' was cancelled and refunded.','booking',result.id);
  for operator_user in select lm.user_id from public.location_members lm where lm.location_id=result.location_id and lm.is_active loop
    insert into public.notifications(user_id,type,title,message,entity_type,entity_id) values(operator_user,'BOOKING_CANCELLED','Booking cancelled',result.booking_reference||' was cancelled.','booking',result.id);
  end loop;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'BOOKING_CANCELLED_AND_REFUNDED','booking',result.id,jsonb_build_object('booking_reference',result.booking_reference,'provider','SIMULATED'));
  return result;
end $$;

alter table public.booking_holds enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.booking_status_history enable row level security;

create policy marketplace_locations_read on public.locations for select to anon, authenticated using (status='ACTIVE' and review_status='APPROVED' and is_published);
create policy marketplace_products_read on public.workspace_products for select to anon, authenticated using (status='ACTIVE' and exists(select 1 from public.locations l where l.id=location_id and l.status='ACTIVE' and l.review_status='APPROVED' and l.is_published));
create policy marketplace_location_hours_read on public.location_operating_hours for select to anon, authenticated using (exists(select 1 from public.locations l where l.id=location_id and l.status='ACTIVE' and l.review_status='APPROVED' and l.is_published));
create policy marketplace_location_images_read on public.location_images for select to anon, authenticated using (exists(select 1 from public.locations l where l.id=location_id and l.status='ACTIVE' and l.review_status='APPROVED' and l.is_published));
create policy marketplace_product_images_read on public.product_images for select to anon, authenticated using (exists(select 1 from public.workspace_products w join public.locations l on l.id=w.location_id where w.id=workspace_product_id and w.status='ACTIVE' and l.status='ACTIVE' and l.review_status='APPROVED' and l.is_published));
create policy marketplace_availability_read on public.availability_schedules for select to anon, authenticated using (exists(select 1 from public.workspace_products w join public.locations l on l.id=w.location_id where w.id=workspace_product_id and w.status='ACTIVE' and l.status='ACTIVE' and l.review_status='APPROVED' and l.is_published));
create policy marketplace_inventory_read on public.inventory_units for select to anon, authenticated using (status='AVAILABLE' and exists(select 1 from public.workspace_products w join public.locations l on l.id=w.location_id where w.id=workspace_product_id and w.status='ACTIVE' and l.status='ACTIVE' and l.review_status='APPROVED' and l.is_published));
create policy profiles_customer_safe_update on public.profiles for update to authenticated using(id=auth.uid() and role='CUSTOMER' and is_active) with check(id=auth.uid() and role='CUSTOMER' and is_active);
create policy profiles_operator_booking_customer_read on public.profiles for select to authenticated using(role='CUSTOMER' and exists(select 1 from public.bookings b where b.customer_id=profiles.id and b.location_id in(select public.current_user_location_ids())));

create policy holds_customer_read on public.booking_holds for select to authenticated using(customer_id=auth.uid() or public.is_super_admin());
create policy bookings_customer_operator_super_read on public.bookings for select to authenticated using(customer_id=auth.uid() or location_id in(select public.current_user_location_ids()) or public.is_super_admin());
create policy payments_customer_operator_super_read on public.payments for select to authenticated using(customer_id=auth.uid() or public.is_super_admin() or exists(select 1 from public.bookings b where b.id=booking_id and b.location_id in(select public.current_user_location_ids())));
create policy notifications_owner_super_read on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_super_admin());
create policy notifications_owner_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy booking_history_relevant_read on public.booking_status_history for select to authenticated using(public.is_super_admin() or exists(select 1 from public.bookings b where b.id=booking_id and (b.customer_id=auth.uid() or b.location_id in(select public.current_user_location_ids()))));

grant usage on schema public to anon;
revoke select on public.locations,public.workspace_products,public.inventory_units,public.location_operating_hours,public.location_images,public.product_images,public.availability_schedules from anon,authenticated;
grant select(id,operator_id,name,slug,description,city,address,state,postal_code,country,timezone,amenities,parking_available,parking_information,house_rules,cancellation_policy,cover_image_path,status,review_status,is_published,published_at) on public.locations to anon,authenticated;
grant select(id,location_id,type,name,slug,description,status,price,pricing_unit,capacity,amenities,maximum_booking_quantity,minimum_booking_minutes,minimum_tenure_months,security_deposit,available_from,configuration,created_at,updated_at) on public.workspace_products to anon,authenticated;
grant select(id,workspace_product_id,code,name,status,available_from) on public.inventory_units to anon,authenticated;
grant select on public.location_operating_hours,public.location_images,public.product_images,public.availability_schedules to anon,authenticated;
revoke update on public.profiles from authenticated;
grant update(full_name,phone) on public.profiles to authenticated;
grant select on public.booking_holds,public.bookings,public.payments,public.notifications,public.booking_status_history to authenticated;
grant update(is_read) on public.notifications to authenticated;
grant all on public.booking_holds,public.bookings,public.payments,public.notifications,public.booking_status_history to service_role;
revoke all on function public.validate_booking_request(uuid,jsonb,uuid),public.create_booking_hold(uuid,jsonb),public.confirm_simulated_booking(uuid),public.release_booking_hold(uuid),public.transition_operator_booking(uuid,public.booking_status,text),public.cancel_booking(uuid,text) from public;
grant execute on function public.validate_booking_request(uuid,jsonb,uuid) to service_role;
grant execute on function public.create_booking_hold(uuid,jsonb),public.confirm_simulated_booking(uuid),public.release_booking_hold(uuid),public.transition_operator_booking(uuid,public.booking_status,text),public.cancel_booking(uuid,text) to authenticated,service_role;

commit;
