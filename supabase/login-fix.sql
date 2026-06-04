create extension if not exists pgcrypto;

create or replace function verify_admin_login(
  p_email text,
  p_password text
)
returns table (
  id uuid,
  name text,
  email text,
  role text,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.name,
    a.email,
    a.role,
    a.is_active
  from admins a
  where lower(a.email) = lower(trim(p_email))
    and a.is_active = true
    and a.password_hash = crypt(p_password, a.password_hash)
  limit 1;
$$;

create or replace function hash_admin_password(
  p_password text
)
returns text
language sql
security definer
set search_path = public
as $$
  select crypt(p_password, gen_salt('bf', 12));
$$;

insert into admins (name, email, password_hash, role, is_active)
values (
  'Super Admin',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf', 12)),
  'superadmin',
  true
)
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  is_active = true;
