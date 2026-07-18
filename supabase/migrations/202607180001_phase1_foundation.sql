begin;

create extension if not exists pgcrypto;
create type public.user_role as enum ('SUPER_ADMIN', 'OPERATOR_ADMIN', 'CUSTOMER');
create type public.operator_status as enum ('ACTIVE', 'SUSPENDED', 'INACTIVE');
create type public.location_status as enum ('DRAFT', 'ACTIVE', 'SUSPENDED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, email text not null, role public.user_role not null default 'CUSTOMER',
  operator_code text unique, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email)),
  constraint profiles_operator_code_uppercase check (operator_code is null or operator_code = upper(operator_code))
);

create table public.operators (
  id uuid primary key default gen_random_uuid(), company_name text not null, slug text unique not null,
  status public.operator_status not null default 'ACTIVE', primary_admin_user_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.operator_members (
  id uuid primary key default gen_random_uuid(), operator_id uuid not null references public.operators(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, role public.user_role not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), unique(operator_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(), operator_id uuid not null references public.operators(id) on delete cascade,
  name text not null, slug text unique not null, city text not null, address text not null, state text, postal_code text,
  country text not null default 'India', status public.location_status not null default 'DRAFT', is_published boolean not null default false,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.location_members (
  id uuid primary key default gen_random_uuid(), location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, is_active boolean not null default true,
  created_at timestamptz not null default now(), unique(location_id, user_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.profiles(id), action text not null,
  entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger operators_updated_at before update on public.operators for each row execute function public.set_updated_at();
create trigger locations_updated_at before update on public.locations for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_role public.user_role := 'CUSTOMER'; raw_role text;
begin
  raw_role := new.raw_app_meta_data ->> 'role';
  if raw_role in ('SUPER_ADMIN','OPERATOR_ADMIN','CUSTOMER') then requested_role := raw_role::public.user_role; end if;
  insert into public.profiles(id, full_name, email, role, operator_code)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'),''), split_part(new.email,'@',1)), lower(new.email), requested_role,
    nullif(upper(trim(coalesce(new.raw_user_meta_data ->> 'operator_code',''))),''))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'SUPER_ADMIN' and p.is_active);
$$;
create or replace function public.current_user_operator_ids() returns setof uuid language sql stable security definer set search_path = '' as $$
  select om.operator_id from public.operator_members om where om.user_id = auth.uid() and om.is_active;
$$;
create or replace function public.current_user_location_ids() returns setof uuid language sql stable security definer set search_path = '' as $$
  select lm.location_id from public.location_members lm where lm.user_id = auth.uid() and lm.is_active;
$$;
revoke all on function public.is_super_admin() from public;
revoke all on function public.current_user_operator_ids() from public;
revoke all on function public.current_user_location_ids() from public;
grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.current_user_operator_ids() to authenticated, service_role;
grant execute on function public.current_user_location_ids() to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.operators enable row level security;
alter table public.operator_members enable row level security;
alter table public.locations enable row level security;
alter table public.location_members enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self_or_super on public.profiles for select to authenticated using (id = auth.uid() or public.is_super_admin());
create policy profiles_super_manage on public.profiles for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create policy operators_super_manage on public.operators for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy operators_member_read on public.operators for select to authenticated using (id in (select public.current_user_operator_ids()));
create policy operator_members_super_manage on public.operator_members for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy operator_members_relevant_read on public.operator_members for select to authenticated using (operator_id in (select public.current_user_operator_ids()));
create policy locations_super_manage on public.locations for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy locations_assigned_read on public.locations for select to authenticated using (id in (select public.current_user_location_ids()));
create policy location_members_super_manage on public.location_members for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy location_members_own_read on public.location_members for select to authenticated using (user_id = auth.uid());
create policy audit_logs_super_read on public.audit_logs for select to authenticated using (public.is_super_admin());

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.operators, public.operator_members, public.locations, public.location_members to authenticated;
grant select on public.audit_logs to authenticated;
grant all on all tables in schema public to service_role;

commit;
