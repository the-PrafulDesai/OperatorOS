begin;

do $$ begin
  if to_regclass('public.locations') is null then
    raise exception 'Phase 1 is required. Run 202607180001_phase1_foundation.sql first.';
  end if;
end $$;

do $$ begin create type public.location_review_status as enum ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.workspace_product_type as enum ('DAY_PASS','MEETING_ROOM','DEDICATED_DESK','PRIVATE_CABIN'); exception when duplicate_object then null; end $$;
do $$ begin create type public.workspace_product_status as enum ('DRAFT','ACTIVE','INACTIVE'); exception when duplicate_object then null; end $$;
do $$ begin create type public.pricing_unit as enum ('PER_PERSON_PER_DAY','PER_HOUR','PER_MONTH'); exception when duplicate_object then null; end $$;
do $$ begin create type public.inventory_unit_status as enum ('AVAILABLE','BLOCKED','INACTIVE'); exception when duplicate_object then null; end $$;

alter table public.locations
  add column if not exists description text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists amenities text[] not null default '{}',
  add column if not exists parking_available boolean not null default false,
  add column if not exists parking_information text,
  add column if not exists house_rules text,
  add column if not exists cancellation_policy text,
  add column if not exists cover_image_path text,
  add column if not exists review_status public.location_review_status not null default 'DRAFT',
  add column if not exists review_notes text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists published_at timestamptz;

alter table public.locations add constraint locations_email_lowercase check (email is null or email = lower(email)) not valid;
alter table public.locations validate constraint locations_email_lowercase;

create table public.location_operating_hours (
  id uuid primary key default gen_random_uuid(), location_id uuid not null references public.locations(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), is_open boolean not null default true,
  opens_at time, closes_at time, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(location_id, day_of_week),
  check ((not is_open and opens_at is null and closes_at is null) or (is_open and opens_at is not null and closes_at is not null and closes_at > opens_at))
);

create table public.location_images (
  id uuid primary key default gen_random_uuid(), location_id uuid not null references public.locations(id) on delete cascade,
  storage_path text not null unique, alt_text text, sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false, created_at timestamptz not null default now()
);
create unique index location_images_one_cover on public.location_images(location_id) where is_cover;

create table public.workspace_products (
  id uuid primary key default gen_random_uuid(), location_id uuid not null references public.locations(id) on delete cascade,
  type public.workspace_product_type not null, name text not null, slug text not null, description text,
  status public.workspace_product_status not null default 'DRAFT', price numeric(12,2) not null check (price > 0),
  pricing_unit public.pricing_unit not null, capacity integer not null check (capacity > 0), amenities text[] not null default '{}',
  maximum_booking_quantity integer check (maximum_booking_quantity is null or maximum_booking_quantity > 0),
  minimum_booking_minutes integer check (minimum_booking_minutes is null or minimum_booking_minutes > 0),
  minimum_tenure_months integer check (minimum_tenure_months is null or minimum_tenure_months > 0),
  security_deposit numeric(12,2) not null default 0 check (security_deposit >= 0), available_from date,
  configuration jsonb not null default '{}', created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(location_id, slug)
);

create table public.inventory_units (
  id uuid primary key default gen_random_uuid(), workspace_product_id uuid not null references public.workspace_products(id) on delete cascade,
  code text not null, name text, status public.inventory_unit_status not null default 'AVAILABLE', available_from date,
  metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_product_id, code), check (code = upper(code))
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(), workspace_product_id uuid not null references public.workspace_products(id) on delete cascade,
  storage_path text not null unique, alt_text text, sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false, created_at timestamptz not null default now()
);
create unique index product_images_one_cover on public.product_images(workspace_product_id) where is_cover;

create table public.availability_schedules (
  id uuid primary key default gen_random_uuid(), workspace_product_id uuid not null references public.workspace_products(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), is_available boolean not null default true,
  opens_at time, closes_at time, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_product_id, day_of_week),
  check ((not is_available and opens_at is null and closes_at is null) or (is_available and opens_at is not null and closes_at is not null and closes_at > opens_at))
);

create trigger location_hours_updated_at before update on public.location_operating_hours for each row execute function public.set_updated_at();
create trigger workspace_products_updated_at before update on public.workspace_products for each row execute function public.set_updated_at();
create trigger inventory_units_updated_at before update on public.inventory_units for each row execute function public.set_updated_at();
create trigger availability_updated_at before update on public.availability_schedules for each row execute function public.set_updated_at();

create or replace function public.reset_approved_location(target uuid) returns void language sql security definer set search_path = '' as $$
  update public.locations set review_status = 'DRAFT', is_published = false, submitted_at = null, reviewed_at = null,
    reviewed_by = null, published_at = null, review_notes = null where id = target and review_status = 'APPROVED';
$$;
create or replace function public.reset_review_on_location_edit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and old.review_status = 'APPROVED' then
    new.review_status := 'DRAFT'; new.is_published := false; new.submitted_at := null; new.reviewed_at := null;
    new.reviewed_by := null; new.published_at := null; new.review_notes := null;
  end if;
  return new;
end $$;
create trigger locations_reset_review before update of name, description, phone, email, timezone, amenities, parking_available,
  parking_information, house_rules, cancellation_policy, address, city, state, postal_code, country on public.locations
  for each row execute function public.reset_review_on_location_edit();

create or replace function public.reset_review_on_child_edit() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_table_name in ('location_operating_hours','location_images') then target := coalesce(new.location_id, old.location_id);
  elsif tg_table_name in ('workspace_products') then target := coalesce(new.location_id, old.location_id);
  elsif tg_table_name in ('inventory_units','product_images','availability_schedules') then
    select wp.location_id into target from public.workspace_products wp where wp.id = coalesce(new.workspace_product_id, old.workspace_product_id);
  end if;
  perform public.reset_approved_location(target);
  if tg_op = 'DELETE' then return old; end if; return new;
end $$;
create trigger location_hours_reset_review after insert or update or delete on public.location_operating_hours for each row execute function public.reset_review_on_child_edit();
create trigger location_images_reset_review after insert or update or delete on public.location_images for each row execute function public.reset_review_on_child_edit();
create trigger products_reset_review after insert or update or delete on public.workspace_products for each row execute function public.reset_review_on_child_edit();
create trigger inventory_reset_review after insert or update or delete on public.inventory_units for each row execute function public.reset_review_on_child_edit();
create trigger product_images_reset_review after insert or update or delete on public.product_images for each row execute function public.reset_review_on_child_edit();
create trigger availability_reset_review after insert or update or delete on public.availability_schedules for each row execute function public.reset_review_on_child_edit();
revoke all on function public.reset_approved_location(uuid), public.reset_review_on_location_edit(), public.reset_review_on_child_edit() from public;

create or replace function public.can_manage_location(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or exists(select 1 from public.location_members lm join public.profiles p on p.id = lm.user_id where lm.location_id = target and lm.user_id = auth.uid() and lm.is_active and p.is_active and p.role = 'OPERATOR_ADMIN');
$$;
create or replace function public.can_manage_product(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or exists(select 1 from public.workspace_products wp where wp.id = target and public.can_manage_location(wp.location_id));
$$;
create or replace function public.can_edit_location(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or (public.can_manage_location(target) and exists(select 1 from public.locations l where l.id = target and l.review_status <> 'IN_REVIEW'));
$$;
create or replace function public.can_edit_product(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or exists(select 1 from public.workspace_products wp where wp.id = target and public.can_edit_location(wp.location_id));
$$;
create or replace function public.can_manage_media_path(object_name text) returns boolean language plpgsql stable security definer set search_path = '' as $$
declare operator_text text := split_part(object_name,'/',2); kind text := split_part(object_name,'/',3); resource_text text := split_part(object_name,'/',4);
begin
  if public.is_super_admin() then return true; end if;
  if split_part(object_name,'/',1) <> 'operators' or operator_text !~ '^[0-9a-fA-F-]{36}$' or resource_text !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  if not exists(select 1 from public.operator_members om where om.operator_id = operator_text::uuid and om.user_id = auth.uid() and om.is_active) then return false; end if;
  if kind = 'locations' then return public.can_edit_location(resource_text::uuid); end if;
  if kind = 'products' then return public.can_edit_product(resource_text::uuid); end if;
  return false;
exception when others then return false;
end $$;
revoke all on function public.can_manage_location(uuid), public.can_manage_product(uuid), public.can_edit_location(uuid), public.can_edit_product(uuid), public.can_manage_media_path(text) from public;
grant execute on function public.can_manage_location(uuid), public.can_manage_product(uuid), public.can_edit_location(uuid), public.can_edit_product(uuid), public.can_manage_media_path(text) to authenticated, service_role;

alter table public.location_operating_hours enable row level security;
alter table public.location_images enable row level security;
alter table public.workspace_products enable row level security;
alter table public.inventory_units enable row level security;
alter table public.product_images enable row level security;
alter table public.availability_schedules enable row level security;

create policy location_hours_read on public.location_operating_hours for select to authenticated using (public.can_manage_location(location_id));
create policy location_hours_write on public.location_operating_hours for all to authenticated using (public.can_edit_location(location_id)) with check (public.can_edit_location(location_id));
create policy location_images_read on public.location_images for select to authenticated using (public.can_manage_location(location_id));
create policy location_images_write on public.location_images for all to authenticated using (public.can_edit_location(location_id)) with check (public.can_edit_location(location_id));
create policy workspace_products_read on public.workspace_products for select to authenticated using (public.can_manage_location(location_id));
create policy workspace_products_write on public.workspace_products for all to authenticated using (public.can_edit_location(location_id)) with check (public.can_edit_location(location_id));
create policy inventory_units_read on public.inventory_units for select to authenticated using (public.can_manage_product(workspace_product_id));
create policy inventory_units_write on public.inventory_units for all to authenticated using (public.can_edit_product(workspace_product_id)) with check (public.can_edit_product(workspace_product_id));
create policy product_images_read on public.product_images for select to authenticated using (public.can_manage_product(workspace_product_id));
create policy product_images_write on public.product_images for all to authenticated using (public.can_edit_product(workspace_product_id)) with check (public.can_edit_product(workspace_product_id));
create policy availability_read on public.availability_schedules for select to authenticated using (public.can_manage_product(workspace_product_id));
create policy availability_write on public.availability_schedules for all to authenticated using (public.can_edit_product(workspace_product_id)) with check (public.can_edit_product(workspace_product_id));
create policy locations_operator_update on public.locations for update to authenticated using (public.can_edit_location(id)) with check (public.can_edit_location(id) and operator_id in (select public.current_user_operator_ids()));

grant select, insert, update, delete on public.location_operating_hours, public.location_images, public.workspace_products, public.inventory_units, public.product_images, public.availability_schedules to authenticated;
grant all on public.location_operating_hours, public.location_images, public.workspace_products, public.inventory_units, public.product_images, public.availability_schedules to service_role;
revoke update on public.locations from authenticated;
grant update (name, description, phone, email, timezone, amenities, parking_available, parking_information, house_rules, cancellation_policy, address, city, state, postal_code, country) on public.locations to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('workspace-media','workspace-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy workspace_media_public_read on storage.objects for select to public using (bucket_id = 'workspace-media');
create policy workspace_media_operator_insert on storage.objects for insert to authenticated with check (bucket_id = 'workspace-media' and public.can_manage_media_path(name));
create policy workspace_media_operator_update on storage.objects for update to authenticated using (bucket_id = 'workspace-media' and public.can_manage_media_path(name)) with check (bucket_id = 'workspace-media' and public.can_manage_media_path(name));
create policy workspace_media_operator_delete on storage.objects for delete to authenticated using (bucket_id = 'workspace-media' and public.can_manage_media_path(name));

commit;
