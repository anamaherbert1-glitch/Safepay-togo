-- Cyenoo: extension multi-pays Mobile Money
-- Corridors: TG, BF, BJ, CI, SN, ML, NE
-- Additive / idempotent (IF NOT EXISTS, ON CONFLICT).

-- ---------------------------------------------------------------------------
-- 1) Élargir le check corridor sur transactions
-- ---------------------------------------------------------------------------
do $$
begin
  -- drop old constraint if present
  if exists (
    select 1 from pg_constraint where conname = 'transactions_corridor_country_chk'
  ) then
    alter table public.transactions drop constraint transactions_corridor_country_chk;
  end if;

  alter table public.transactions
    add constraint transactions_corridor_country_chk
    check (
      corridor_country is null
      or corridor_country in ('TG', 'BF', 'BJ', 'CI', 'SN', 'ML', 'NE')
    );
end $$;

-- ---------------------------------------------------------------------------
-- 2) Table mm_operators : élargir country_code + colonnes badge
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'mm_operators'
  ) then
    -- drop old country check if any
    if exists (
      select 1 from pg_constraint where conname = 'mm_operators_country_code_check'
    ) then
      alter table public.mm_operators drop constraint mm_operators_country_code_check;
    end if;
  end if;
end $$;

alter table public.mm_operators
  drop constraint if exists mm_operators_country_code_check;

alter table public.mm_operators
  add constraint mm_operators_country_code_check
  check (country_code in ('TG', 'BF', 'BJ', 'CI', 'SN', 'ML', 'NE'));

alter table public.mm_operators
  add column if not exists brand text,
  add column if not exists short_label text,
  add column if not exists logo_path text;

-- ---------------------------------------------------------------------------
-- 3) Seed / upsert tous les opérateurs
-- ---------------------------------------------------------------------------
insert into public.mm_operators (
  code, label, country_code, provider_aliases, is_active, sort_order, brand, short_label, logo_path
) values
  -- Togo
  ('MIXX_TG',  'Mixx by Yas',  'TG', array['Mixx by Yas','mixx','yas','t-money','tmoney','togocel'], true, 5,  'mixx',   'MX',  '/operators/mixx.svg'),
  ('TMONEY',   'T-Money',      'TG', array['T-Money','tmoney','t-money','togocel','togocell'], true, 15, 'mixx',   'TM',  '/operators/mixx.svg'),
  ('MOOV_TG',  'Moov Money',   'TG', array['Moov Money','moov','flooz','moov money'], true, 20, 'moov',   'MV',  '/operators/moov.svg'),
  -- Burkina Faso
  ('ORANGE_BF','Orange Money', 'BF', array['Orange Money','orange','orange money'], true, 10, 'orange', 'OM',  '/operators/orange.svg'),
  ('MOOV_BF',  'Moov Money',   'BF', array['Moov Money','moov','moov money'], true, 20, 'moov',   'MV',  '/operators/moov.svg'),
  -- Bénin
  ('MTN_BJ',   'MTN MoMo',     'BJ', array['MTN MoMo','mtn','momo','mtn momo'], true, 10, 'mtn',    'MTN', '/operators/mtn.svg'),
  ('MOOV_BJ',  'Moov Money',   'BJ', array['Moov Money','moov','moov money'], true, 20, 'moov',   'MV',  '/operators/moov.svg'),
  -- Côte d'Ivoire
  ('ORANGE_CI','Orange Money', 'CI', array['Orange Money','orange','orange money'], true, 10, 'orange', 'OM',  '/operators/orange.svg'),
  ('MTN_CI',   'MTN MoMo',     'CI', array['MTN MoMo','mtn','momo','mtn momo'], true, 20, 'mtn',    'MTN', '/operators/mtn.svg'),
  ('MOOV_CI',  'Moov Money',   'CI', array['Moov Money','moov','moov money'], true, 30, 'moov',   'MV',  '/operators/moov.svg'),
  ('WAVE_CI',  'Wave',         'CI', array['Wave','wave'], true, 40, 'wave',   'WV',  '/operators/wave.svg'),
  -- Sénégal
  ('ORANGE_SN','Orange Money', 'SN', array['Orange Money','orange','orange money'], true, 10, 'orange', 'OM',  '/operators/orange.svg'),
  ('FREE_SN',  'Free Money',   'SN', array['Free Money','free','free money'], true, 20, 'free',   'FM',  '/operators/free.svg'),
  ('WAVE_SN',  'Wave',         'SN', array['Wave','wave'], true, 30, 'wave',   'WV',  '/operators/wave.svg'),
  -- Mali
  ('ORANGE_ML','Orange Money', 'ML', array['Orange Money','orange','orange money'], true, 10, 'orange', 'OM',  '/operators/orange.svg'),
  ('MOOV_ML',  'Moov Money',   'ML', array['Moov Money','moov','moov money'], true, 20, 'moov',   'MV',  '/operators/moov.svg'),
  -- Niger
  ('ORANGE_NE','Orange Money', 'NE', array['Orange Money','orange','orange money'], true, 10, 'orange', 'OM',  '/operators/orange.svg'),
  ('AIRTEL_NE','Airtel Money', 'NE', array['Airtel Money','airtel','airtel money'], true, 20, 'airtel', 'AM',  '/operators/airtel.svg')
on conflict (code) do update set
  label = excluded.label,
  country_code = excluded.country_code,
  provider_aliases = excluded.provider_aliases,
  is_active = true,
  sort_order = excluded.sort_order,
  brand = excluded.brand,
  short_label = excluded.short_label,
  logo_path = excluded.logo_path;

-- Masquer l'ancien code T-Money en UI (gardé pour compat alias)
update public.mm_operators set is_active = false where code = 'TMONEY';

-- ---------------------------------------------------------------------------
-- 4) Helpers multi-pays
-- ---------------------------------------------------------------------------
create or replace function public.assert_same_country_corridor(p_country text)
returns text
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  v text := upper(trim(coalesce(p_country, '')));
begin
  if v not in ('TG', 'BF', 'BJ', 'CI', 'SN', 'ML', 'NE') then
    raise exception 'unsupported_corridor_country';
  end if;
  return v;
end;
$function$;

create or replace function public.normalize_mm_provider(p_provider text, p_country text default null)
returns text
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  v text := lower(trim(coalesce(p_provider, '')));
  v_country text := upper(trim(coalesce(p_country, '')));
  v_label text;
begin
  if v = '' then return null; end if;

  if v in ('carte bancaire', 'card', 'visa', 'mastercard', 'bank_card') then
    raise exception 'card_payments_disabled';
  end if;

  -- alias rapides multi-pays
  if v in ('mixx by yas', 'mixx', 'yas') then return 'Mixx by Yas'; end if;
  if v in ('t-money', 'tmoney', 'togocel', 'togocell') then return 'T-Money'; end if;
  if v in ('moov money', 'moov', 'flooz') then return 'Moov Money'; end if;
  if v in ('orange money', 'orange') then return 'Orange Money'; end if;
  if v in ('mtn momo', 'mtn', 'momo') then return 'MTN MoMo'; end if;
  if v in ('wave') then return 'Wave'; end if;
  if v in ('free money', 'free') then return 'Free Money'; end if;
  if v in ('airtel money', 'airtel') then return 'Airtel Money'; end if;

  select o.label into v_label
  from public.mm_operators o
  where o.is_active
    and (v_country = '' or o.country_code = v_country)
    and (
      lower(o.label) = v
      or lower(o.code) = v
      or exists (select 1 from unnest(o.provider_aliases) a where lower(a) = v)
    )
  order by o.sort_order
  limit 1;

  return v_label;
end;
$function$;

-- RPC liste opérateurs (utilisable par le front)
create or replace function public.get_mm_operators(p_country text)
returns table (
  code text,
  label text,
  country_code text,
  brand text,
  short_label text,
  logo_path text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select o.code, o.label, o.country_code, o.brand, o.short_label, o.logo_path
  from public.mm_operators o
  where o.is_active
    and o.country_code = upper(trim(p_country))
  order by o.sort_order, o.label;
$function$;

revoke all on function public.get_mm_operators(text) from public;
grant execute on function public.get_mm_operators(text) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 5) Colonnes dépôt / retrait pour operator_code + country
-- ---------------------------------------------------------------------------
alter table public.deposits
  add column if not exists operator_code text,
  add column if not exists corridor_country text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'deposits_corridor_country_chk'
  ) then
    alter table public.deposits
      add constraint deposits_corridor_country_chk
      check (
        corridor_country is null
        or corridor_country in ('TG', 'BF', 'BJ', 'CI', 'SN', 'ML', 'NE')
      );
  end if;
end $$;

create index if not exists deposits_operator_code_idx
  on public.deposits (operator_code)
  where operator_code is not null;

-- withdrawals table may exist; add same cols if present
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'withdrawals'
  ) then
    alter table public.withdrawals
      add column if not exists operator_code text,
      add column if not exists corridor_country text;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6) Feature flags multi-pays
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value_boolean, description)
values
  ('mm_multi_country_enabled', true, 'Cyenoo: Mobile Money multi-pays (même pays uniquement)'),
  ('cross_border_enabled', false, 'Cyenoo: envois inter-pays toujours désactivés')
on conflict (key) do update
  set value_boolean = excluded.value_boolean,
      description = coalesce(excluded.description, public.app_settings.description);

-- ---------------------------------------------------------------------------
-- 7) Vue lecture opérateurs actifs (optionnelle, pour admin)
-- ---------------------------------------------------------------------------
create or replace view public.v_mm_operators_active as
select
  code,
  label,
  country_code,
  brand,
  short_label,
  logo_path,
  sort_order
from public.mm_operators
where is_active = true
order by country_code, sort_order;

grant select on public.v_mm_operators_active to authenticated, anon;
