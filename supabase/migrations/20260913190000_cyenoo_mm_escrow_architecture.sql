-- Cyenoo V1: Mobile Money national only + escrow funding modes (wallet | direct_mm)
-- Additive migration. Safe to re-run (IF NOT EXISTS / ON CONFLICT).

-- 1. Feature flags
insert into public.app_settings (key, value_boolean, description)
values
  ('card_payments_enabled', false, 'Cyenoo V1: carte bancaire desactivee'),
  ('cross_border_enabled', false, 'Cyenoo V1: envois inter-pays desactives')
on conflict (key) do update
  set value_boolean = excluded.value_boolean,
      description = coalesce(excluded.description, public.app_settings.description);

update public.app_settings set value_boolean = false where key = 'card_payments_enabled';

-- 2. Transactions columns
alter table public.transactions
  add column if not exists payment_source text,
  add column if not exists recipient_operator text,
  add column if not exists buyer_operator text,
  add column if not exists funding_status text default 'unfunded',
  add column if not exists corridor_country text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_payment_source_chk') then
    alter table public.transactions add constraint transactions_payment_source_chk
      check (payment_source is null or payment_source in ('wallet', 'direct_mm'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_funding_status_chk') then
    alter table public.transactions add constraint transactions_funding_status_chk
      check (funding_status is null or funding_status in ('unfunded', 'funding', 'funded', 'failed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_corridor_country_chk') then
    alter table public.transactions add constraint transactions_corridor_country_chk
      check (corridor_country is null or corridor_country in ('TG', 'BF'));
  end if;
end $$;

create index if not exists transactions_funding_status_idx on public.transactions (status, funding_status);
create index if not exists transactions_seller_phone_idx on public.transactions (seller_phone);

alter table public.deposits add column if not exists transaction_id uuid references public.transactions(id);
create index if not exists deposits_transaction_id_idx on public.deposits (transaction_id) where transaction_id is not null;

-- 3. MM operators
create table if not exists public.mm_operators (
  code text primary key,
  label text not null,
  country_code text not null check (country_code in ('TG', 'BF')),
  provider_aliases text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 100
);

insert into public.mm_operators (code, label, country_code, provider_aliases, sort_order) values
  ('TMONEY',  'T-Money',      'TG', array['T-Money','tmoney','t-money','togocel','togocell'], 10),
  ('MOOV_TG', 'Moov Money',   'TG', array['Moov Money','moov','flooz','moov money'], 20),
  ('ORANGE_BF','Orange Money','BF', array['Orange Money','orange','orange money'], 10),
  ('MOOV_BF', 'Moov Money',   'BF', array['Moov Money','moov','moov money'], 20)
on conflict (code) do update set
  label = excluded.label,
  provider_aliases = excluded.provider_aliases,
  is_active = true,
  sort_order = excluded.sort_order;

-- 4. Helpers
create or replace function public.normalize_mm_provider(p_provider text, p_country text default null)
returns text language plpgsql stable set search_path to 'public' as $function$
declare
  v text := lower(trim(coalesce(p_provider, '')));
  v_country text := upper(trim(coalesce(p_country, '')));
  v_code text;
begin
  if v = '' then return null; end if;
  if v in ('carte bancaire', 'card', 'visa', 'mastercard', 'bank_card') then
    raise exception 'card_payments_disabled';
  end if;
  if v_country = 'TG' or v_country = '' then
    if v in ('t-money', 'tmoney', 'togocel', 'togocell') then return 'T-Money'; end if;
    if v in ('moov money', 'moov', 'flooz', 'moov_tg') then return 'Moov Money'; end if;
  end if;
  if v_country = 'BF' or v_country = '' then
    if v in ('orange money', 'orange', 'orange_bf') then return 'Orange Money'; end if;
    if v in ('moov money', 'moov', 'moov_bf') then return 'Moov Money'; end if;
  end if;
  select o.label into v_code from public.mm_operators o
  where o.is_active and (v_country = '' or o.country_code = v_country)
    and (lower(o.label) = v or lower(o.code) = v
      or exists (select 1 from unnest(o.provider_aliases) a where lower(a) = v))
  order by o.sort_order limit 1;
  return v_code;
end;
$function$;

create or replace function public.assert_same_country_corridor(p_country text)
returns text language plpgsql stable set search_path to 'public' as $function$
declare v text := upper(trim(coalesce(p_country, '')));
begin
  if v not in ('TG', 'BF') then raise exception 'unsupported_corridor_country'; end if;
  return v;
end;
$function$;

create or replace function public.get_mm_operators(p_country text)
returns table (code text, label text, country_code text)
language sql stable security definer set search_path to 'public' as $function$
  select o.code, o.label, o.country_code from public.mm_operators o
  where o.is_active and o.country_code = upper(trim(p_country))
  order by o.sort_order, o.label;
$function$;
revoke all on function public.get_mm_operators(text) from public;
grant execute on function public.get_mm_operators(text) to authenticated, anon;

-- 5. create_cyenoo_transaction
create or replace function public.create_cyenoo_transaction(
  p_recipient_phone text,
  p_corridor_country text,
  p_recipient_operator text,
  p_payment_source text,
  p_description text,
  p_amount numeric,
  p_delivery_delay text default null,
  p_conditions text default null,
  p_buyer_operator text default null,
  p_provider_id uuid default null,
  p_payment_method_id uuid default null
) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_seller_id uuid;
  v_country text;
  v_recipient_op text;
  v_buyer_op text;
  v_source text;
  v_currency text := 'XOF';
  v_phone text;
  v_max_per_day numeric;
  v_count_today int;
  v_transaction_id uuid;
  f jsonb;
  v_maintenance boolean;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select value_boolean into v_maintenance from public.app_settings where key = 'maintenance_mode';
  if coalesce(v_maintenance, false) then raise exception 'maintenance_mode_active'; end if;
  if not public.is_feature_enabled('transfers_enabled') then raise exception 'feature_disabled: transfers_enabled'; end if;
  v_source := lower(trim(coalesce(p_payment_source, '')));
  if v_source not in ('wallet', 'direct_mm') then raise exception 'invalid_payment_source'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if coalesce(trim(p_description), '') = '' then raise exception 'description_required'; end if;
  v_country := public.assert_same_country_corridor(p_corridor_country);
  v_recipient_op := public.normalize_mm_provider(p_recipient_operator, v_country);
  if v_recipient_op is null then raise exception 'unsupported_recipient_operator'; end if;
  if v_source = 'direct_mm' then
    v_buyer_op := public.normalize_mm_provider(p_buyer_operator, v_country);
    if v_buyer_op is null then raise exception 'buyer_operator_required_for_direct_mm'; end if;
  else
    v_buyer_op := public.normalize_mm_provider(p_buyer_operator, v_country);
  end if;
  v_phone := trim(p_recipient_phone);
  if v_phone is null or length(v_phone) < 8 then raise exception 'invalid_recipient_phone'; end if;
  select id into v_account_id from public.accounts where user_id = v_uid and is_active = true limit 1;
  if v_account_id is null then raise exception 'active_account_not_found'; end if;
  select value_numeric into v_max_per_day from public.app_settings where key = 'max_transactions_per_day';
  if v_max_per_day is not null then
    select count(*) into v_count_today from public.transactions t
    where t.account_id = v_account_id and t.created_at >= date_trunc('day', now());
    if v_count_today >= v_max_per_day then raise exception 'daily_transaction_limit_exceeded'; end if;
  end if;
  select p.id into v_seller_id from public.profiles p where p.phone = v_phone limit 1;
  if v_seller_id is not null and v_seller_id = v_uid then raise exception 'self_transaction_not_allowed'; end if;
  f := public.calculate_transaction_fees(p_amount, v_currency, p_provider_id, p_payment_method_id);
  insert into public.transactions (
    account_id, seller_id, seller_phone, seller_country, description, amount, commission, currency, status,
    delivery_delay, conditions, provider_id, payment_method_id, provider_code, payment_method,
    fee_configuration_version, buyer_total, escrow_amount, seller_net,
    payment_source, recipient_operator, buyer_operator, funding_status, corridor_country
  ) values (
    v_account_id, v_seller_id, v_phone, v_country, trim(p_description), round(p_amount, 2),
    (f->>'safepay_fee')::numeric, v_currency, 'pending',
    nullif(trim(coalesce(p_delivery_delay, '')), ''), nullif(trim(coalesce(p_conditions, '')), ''),
    (f->>'provider_id')::uuid, (f->>'payment_method_id')::uuid, f->>'provider_code',
    coalesce(f->>'payment_method', v_recipient_op), (f->>'configuration_version')::bigint,
    (f->>'buyer_total')::numeric, (f->>'escrow_amount')::numeric, (f->>'seller_net')::numeric,
    v_source, v_recipient_op, v_buyer_op, 'unfunded', v_country
  ) returning id into v_transaction_id;
  insert into public.transaction_fee_snapshots (
    transaction_id, gross_amount, provider_collection_fee, safepay_fee, payout_fee, total_customer_fee,
    buyer_total, escrow_amount, seller_gross, seller_net, provider_revenue, safepay_revenue, fee_payer,
    provider_id, payment_method_id, provider_code, payment_method, currency, configuration_version
  ) values (
    v_transaction_id, (f->>'gross_amount')::numeric, (f->>'provider_collection_fee')::numeric,
    (f->>'safepay_fee')::numeric, (f->>'payout_fee')::numeric, (f->>'total_customer_fee')::numeric,
    (f->>'buyer_total')::numeric, (f->>'escrow_amount')::numeric, (f->>'seller_gross')::numeric,
    (f->>'seller_net')::numeric, (f->>'provider_revenue')::numeric, (f->>'safepay_revenue')::numeric,
    f->>'fee_payer', (f->>'provider_id')::uuid, (f->>'payment_method_id')::uuid,
    f->>'provider_code', f->>'payment_method', f->>'currency', (f->>'configuration_version')::bigint
  );
  insert into public.transaction_status_history (transaction_id, from_status, to_status, changed_by, reason)
  values (v_transaction_id, null, 'pending', v_uid,
    'Cyenoo transaction created (' || v_source || ', ' || v_country || ', ' || v_recipient_op || ')');
  return v_transaction_id;
end;
$function$;
revoke all on function public.create_cyenoo_transaction(text, text, text, text, text, numeric, text, text, text, uuid, uuid) from public;
grant execute on function public.create_cyenoo_transaction(text, text, text, text, text, numeric, text, text, text, uuid, uuid) to authenticated;

-- 6. fund from wallet
create or replace function public.fund_transaction_from_wallet(p_transaction_id uuid)
returns public.transactions language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_tx public.transactions;
  v_wallet public.wallets;
  v_total numeric;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select id into v_account_id from public.accounts where user_id = v_uid and is_active = true limit 1;
  if v_account_id is null then raise exception 'active_account_not_found'; end if;
  select * into v_tx from public.transactions where id = p_transaction_id for update;
  if not found then raise exception 'transaction_not_found'; end if;
  if v_tx.account_id <> v_account_id then raise exception 'not_transaction_owner'; end if;
  if v_tx.status <> 'pending' then raise exception 'transaction_not_pending'; end if;
  if coalesce(v_tx.payment_source, 'wallet') <> 'wallet' then raise exception 'payment_source_not_wallet'; end if;
  if coalesce(v_tx.funding_status, 'unfunded') = 'funded' then return v_tx; end if;
  v_total := coalesce(v_tx.buyer_total, v_tx.amount + coalesce(v_tx.commission, 0));
  select * into v_wallet from public.wallets where account_id = v_account_id for update;
  if v_wallet.id is null then raise exception 'wallet_not_found'; end if;
  if v_wallet.balance < v_total then raise exception 'insufficient_balance'; end if;
  update public.wallets set balance = balance - v_total, locked_balance = locked_balance + v_total, updated_at = now()
  where id = v_wallet.id;
  begin
    insert into public.wallet_ledger (wallet_id, entry_type, amount, balance_after, description, reference_type, reference_id)
    values (v_wallet.id, 'debit', v_total, v_wallet.balance - v_total, 'Escrow Cyenoo — financement transaction', 'transaction', p_transaction_id);
  exception when others then null;
  end;
  update public.transactions set status = 'funded', funding_status = 'funded', updated_at = now()
  where id = p_transaction_id returning * into v_tx;
  insert into public.transaction_status_history (transaction_id, from_status, to_status, changed_by, reason)
  values (p_transaction_id, 'pending', 'funded', v_uid, 'Funded from Cyenoo wallet');
  return v_tx;
end;
$function$;
revoke all on function public.fund_transaction_from_wallet(uuid) from public;
grant execute on function public.fund_transaction_from_wallet(uuid) to authenticated;

-- 7. create_deposit_intent MM only
create or replace function public.create_deposit_intent(
  p_amount numeric, p_provider text, p_currency text default 'XOF', p_idempotency_key text default null
) returns public.deposits language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_existing public.deposits;
  v_deposit public.deposits;
  v_currency text := upper(trim(coalesce(p_currency, 'XOF')));
  v_provider text;
  v_maintenance boolean;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select value_boolean into v_maintenance from public.app_settings where key = 'maintenance_mode';
  if coalesce(v_maintenance, false) then raise exception 'maintenance_mode_active'; end if;
  if not public.is_feature_enabled('deposits_enabled') then raise exception 'feature_disabled: deposits_enabled'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  v_provider := public.normalize_mm_provider(p_provider, null);
  if v_provider is null then
    v_provider := case lower(trim(coalesce(p_provider, '')))
      when 't-money' then 'T-Money' when 'tmoney' then 'T-Money'
      when 'moov money' then 'Moov Money' when 'flooz' then 'Moov Money'
      when 'orange money' then 'Orange Money' else null end;
  end if;
  if v_provider is null then raise exception 'unsupported_provider'; end if;
  if v_currency !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
  select id into v_account_id from public.accounts where user_id = v_uid and is_active = true limit 1;
  if v_account_id is null then raise exception 'active_account_not_found'; end if;
  if p_idempotency_key is not null then
    select * into v_existing from public.deposits where account_id = v_account_id and idempotency_key = p_idempotency_key limit 1;
    if found then return v_existing; end if;
  end if;
  insert into public.deposits (account_id, amount, currency, provider, status, idempotency_key)
  values (v_account_id, round(p_amount, 2), v_currency, v_provider, 'pending', p_idempotency_key)
  returning * into v_deposit;
  return v_deposit;
end;
$function$;

-- 8. direct MM collect intent
create or replace function public.create_transaction_mm_collect_intent(
  p_transaction_id uuid, p_idempotency_key text default null
) returns public.deposits language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_tx public.transactions;
  v_deposit public.deposits;
  v_amount numeric;
  v_provider text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select id into v_account_id from public.accounts where user_id = v_uid and is_active = true limit 1;
  if v_account_id is null then raise exception 'active_account_not_found'; end if;
  select * into v_tx from public.transactions where id = p_transaction_id for update;
  if not found then raise exception 'transaction_not_found'; end if;
  if v_tx.account_id <> v_account_id then raise exception 'not_transaction_owner'; end if;
  if v_tx.status <> 'pending' then raise exception 'transaction_not_pending'; end if;
  if coalesce(v_tx.payment_source, '') <> 'direct_mm' then raise exception 'payment_source_not_direct_mm'; end if;
  v_provider := coalesce(v_tx.buyer_operator, public.normalize_mm_provider(v_tx.payment_method, v_tx.corridor_country));
  if v_provider is null then raise exception 'buyer_operator_missing'; end if;
  v_amount := coalesce(v_tx.buyer_total, v_tx.amount + coalesce(v_tx.commission, 0));
  if p_idempotency_key is not null then
    select * into v_deposit from public.deposits where account_id = v_account_id and idempotency_key = p_idempotency_key limit 1;
    if found then return v_deposit; end if;
  end if;
  insert into public.deposits (account_id, amount, currency, provider, status, idempotency_key, transaction_id)
  values (v_account_id, round(v_amount, 2), coalesce(v_tx.currency, 'XOF'), v_provider, 'pending', p_idempotency_key, p_transaction_id)
  returning * into v_deposit;
  update public.transactions set funding_status = 'funding', updated_at = now() where id = p_transaction_id;
  return v_deposit;
end;
$function$;
revoke all on function public.create_transaction_mm_collect_intent(uuid, text) from public;
grant execute on function public.create_transaction_mm_collect_intent(uuid, text) to authenticated;

-- 9. mark TX funded from deposit
create or replace function public.mark_transaction_funded_from_deposit(p_deposit_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  d public.deposits%rowtype;
  v_tx public.transactions%rowtype;
begin
  select * into d from public.deposits where id = p_deposit_id;
  if not found then raise exception 'deposit_not_found'; end if;
  if d.status <> 'successful' then return jsonb_build_object('ok', false, 'reason', 'deposit_not_successful'); end if;
  if d.transaction_id is null then return jsonb_build_object('ok', true, 'skipped', true); end if;
  select * into v_tx from public.transactions where id = d.transaction_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'transaction_not_found'); end if;
  if v_tx.status = 'funded' and coalesce(v_tx.funding_status, '') = 'funded' then
    return jsonb_build_object('ok', true, 'already_funded', true);
  end if;
  if v_tx.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'transaction_not_pending'); end if;
  update public.transactions set status = 'funded', funding_status = 'funded', updated_at = now() where id = v_tx.id;
  insert into public.transaction_status_history (transaction_id, from_status, to_status, changed_by, reason)
  values (v_tx.id, v_tx.status, 'funded', null, 'Funded via direct Mobile Money collect (deposit ' || p_deposit_id::text || ')');
  return jsonb_build_object('ok', true, 'transaction_id', v_tx.id, 'status', 'funded');
end;
$function$;
revoke all on function public.mark_transaction_funded_from_deposit(uuid) from public;
grant execute on function public.mark_transaction_funded_from_deposit(uuid) to service_role;
