create extension if not exists "pgcrypto";

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('superadmin', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists prizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null default 'A',
  image_url text null,
  emoji text,
  color text,
  probability integer not null check (probability > 0),
  prize_status text not null default 'win' check (prize_status = 'win'),
  stock integer null check (stock is null or stock >= 0),
  active boolean not null default true,
  sorter integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_type text not null check (game_type in ('spin', 'claw', 'both')),
  status text not null default 'unused' check (status in ('unused', 'used', 'void')),
  created_by uuid null references admins(id) on delete set null,
  used_at timestamptz null,
  used_prize_id uuid null references prizes(id) on delete set null,
  used_prize_name text null,
  member_note text null,
  created_at timestamptz not null default now()
);

create table if not exists play_history (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers(id) on delete cascade,
  voucher_code text not null,
  game_type text not null check (game_type in ('spin', 'claw')),
  prize_id uuid not null references prizes(id) on delete restrict,
  prize_name text not null,
  prize_emoji text,
  prize_status text not null default 'win' check (prize_status = 'win'),
  played_at timestamptz not null default now(),
  claim_status text not null default 'pending' check (claim_status in ('pending', 'claimed', 'cancelled'))
);

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid null references admins(id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vouchers_code_idx on vouchers (upper(code));
create index if not exists vouchers_status_idx on vouchers (status);
create index if not exists play_history_played_at_idx on play_history (played_at desc);
create index if not exists admin_logs_created_at_idx on admin_logs (created_at desc);

create or replace function redeem_voucher(
  p_code text,
  p_game_type text,
  p_member_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voucher vouchers%rowtype;
  v_prize prizes%rowtype;
  v_prize_id uuid;
  v_total integer;
  v_roll numeric;
  v_history play_history%rowtype;
begin
  if p_game_type not in ('spin', 'claw') then
    raise exception 'Game tidak valid.';
  end if;

  select * into v_voucher
  from vouchers
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Kode voucher tidak ditemukan.';
  end if;

  if v_voucher.status <> 'unused' then
    raise exception 'Kode voucher sudah dipakai atau tidak aktif.';
  end if;

  if v_voucher.game_type not in (p_game_type, 'both') then
    raise exception 'Voucher tidak berlaku untuk game ini.';
  end if;

  select coalesce(sum(probability), 0) into v_total
  from prizes
  where active = true and prize_status = 'win' and (stock is null or stock > 0);

  if v_total <= 0 then
    raise exception 'Belum ada hadiah aktif.';
  end if;

  v_roll := random() * v_total;

  select id into v_prize_id
  from (
    select p.*, sum(probability) over (order by created_at, id) as running_weight
    from prizes p
    where active = true and prize_status = 'win' and (stock is null or stock > 0)
  ) weighted
  where running_weight >= v_roll
  order by running_weight
  limit 1;

  select * into v_prize
  from prizes
  where id = v_prize_id
  for update;

  if v_prize.id is null then
    select * into v_prize
    from prizes
    where active = true and prize_status = 'win' and (stock is null or stock > 0)
    order by created_at desc
    limit 1
    for update;
  end if;

  update vouchers
  set status = 'used',
      used_at = now(),
      used_prize_id = v_prize.id,
      used_prize_name = v_prize.name,
      member_note = p_member_note
  where id = v_voucher.id;

  if v_prize.stock is not null then
    update prizes set stock = greatest(stock - 1, 0) where id = v_prize.id;
  end if;

  insert into play_history (voucher_id, voucher_code, game_type, prize_id, prize_name, prize_emoji, prize_status)
  values (v_voucher.id, v_voucher.code, p_game_type, v_prize.id, v_prize.name, v_prize.emoji, 'win')
  returning * into v_history;

  return jsonb_build_object(
    'voucher', jsonb_build_object('id', v_voucher.id, 'code', v_voucher.code, 'game_type', v_voucher.game_type),
    'prize', jsonb_build_object('id', v_prize.id, 'name', v_prize.name, 'emoji', v_prize.emoji, 'color', v_prize.color, 'prize_status', 'win'),
    'history', to_jsonb(v_history),
    'prizes', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'emoji', emoji, 'color', color) order by created_at), '[]'::jsonb)
      from (
        select id, name, emoji, color, created_at
        from prizes
        where active = true and prize_status = 'win'
        order by created_at
        limit 8
      ) active_prizes
    )
  );
end;
$$;

grant execute on function redeem_voucher(text, text, text) to anon, authenticated;
