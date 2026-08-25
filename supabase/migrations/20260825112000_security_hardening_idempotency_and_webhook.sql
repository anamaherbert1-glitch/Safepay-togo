create unique index if not exists deposits_account_idempotency_key_uq on public.deposits(account_id,idempotency_key) where idempotency_key is not null;
create unique index if not exists withdrawals_account_idempotency_key_uq on public.withdrawals(account_id,idempotency_key) where idempotency_key is not null;
create index if not exists withdrawals_account_created_at_idx on public.withdrawals(account_id,created_at);
create index if not exists transactions_account_created_at_idx on public.transactions(account_id,created_at);

-- Canonical deposit intent with database-enforced per-account idempotency.
create or replace function public.create_deposit_intent(p_amount numeric, p_provider text, p_currency text default 'XOF', p_idempotency_key text default null)
returns public.deposits language plpgsql security definer set search_path to 'public' as $function$
declare v_uid uuid:=auth.uid(); v_account_id uuid; v_existing public.deposits; v_deposit public.deposits; v_currency text:=upper(trim(coalesce(p_currency,'XOF'))); v_provider text; v_maintenance boolean;
begin
 if v_uid is null then raise exception 'not_authenticated'; end if;
 select value_boolean into v_maintenance from public.app_settings where key='maintenance_mode';
 if coalesce(v_maintenance,false) then raise exception 'maintenance_mode_active'; end if;
 if not public.is_feature_enabled('deposits_enabled') then raise exception 'feature_disabled: deposits_enabled'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'invalid_amount'; end if;
 v_provider:=case lower(trim(coalesce(p_provider,''))) when 't-money' then 'T-Money' when 'tmoney' then 'T-Money' when 'moov money' then 'Moov Money' when 'flooz' then 'Moov Money' when 'carte bancaire' then 'Carte bancaire' when 'card' then 'Carte bancaire' else null end;
 if v_provider is null then raise exception 'unsupported_provider'; end if;
 if v_provider='Carte bancaire' and not public.is_feature_enabled('card_payments_enabled') then raise exception 'feature_disabled: card_payments_enabled'; end if;
 if v_currency !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
 select id into v_account_id from public.accounts where user_id=v_uid and is_active=true limit 1;
 if v_account_id is null then raise exception 'active_account_not_found'; end if;
 if p_idempotency_key is not null then select * into v_existing from public.deposits where account_id=v_account_id and idempotency_key=p_idempotency_key limit 1; if found then return v_existing; end if; end if;
 begin
   insert into public.deposits(account_id,amount,provider,status,currency,idempotency_key) values(v_account_id,p_amount,v_provider,'pending',v_currency,p_idempotency_key) returning * into v_deposit;
 exception when unique_violation then
   if p_idempotency_key is not null then select * into v_existing from public.deposits where account_id=v_account_id and idempotency_key=p_idempotency_key limit 1; if found then return v_existing; end if; end if;
   raise;
 end;
 return v_deposit;
end;
$function$;

-- Serialize withdrawal decisions on the wallet row and re-check idempotency after the lock.
create or replace function public.create_withdrawal_intent(p_amount numeric, p_provider text, p_currency text default 'XOF', p_idempotency_key text default null)
returns public.withdrawals language plpgsql security definer set search_path to 'public' as $function$
declare v_account uuid; v_wallet public.wallets; v_w public.withdrawals; v_existing public.withdrawals; v_provider text; v_maintenance boolean; v_daily_limit numeric; v_fee_pct numeric; v_fee numeric; v_already_today numeric;
begin
 if auth.uid() is null then raise exception 'not_authenticated'; end if;
 select value_boolean into v_maintenance from public.app_settings where key='maintenance_mode';
 if coalesce(v_maintenance,false) then raise exception 'maintenance_mode_active'; end if;
 if not public.is_feature_enabled('withdrawals_enabled') then raise exception 'feature_disabled: withdrawals_enabled'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'invalid_amount'; end if;
 v_provider:=case lower(trim(coalesce(p_provider,''))) when 't-money' then 'T-Money' when 'tmoney' then 'T-Money' when 'moov money' then 'Moov Money' when 'flooz' then 'Moov Money' when 'carte bancaire' then 'Carte bancaire' when 'card' then 'Carte bancaire' else null end;
 if v_provider is null then raise exception 'invalid_provider'; end if;
 if upper(trim(coalesce(p_currency,'XOF'))) !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
 select id into v_account from public.accounts where user_id=auth.uid() and is_active=true limit 1;
 if v_account is null then raise exception 'account_not_found'; end if;
 if p_idempotency_key is not null then select * into v_existing from public.withdrawals where account_id=v_account and idempotency_key=p_idempotency_key limit 1; if found then return v_existing; end if; end if;
 select * into v_wallet from public.wallets where account_id=v_account for update;
 if v_wallet.id is null then raise exception 'wallet_not_found'; end if;
 if p_idempotency_key is not null then select * into v_existing from public.withdrawals where account_id=v_account and idempotency_key=p_idempotency_key limit 1; if found then return v_existing; end if; end if;
 select value_numeric into v_daily_limit from public.app_settings where key='daily_withdrawal_limit';
 if v_daily_limit is not null then select coalesce(sum(amount),0) into v_already_today from public.withdrawals where account_id=v_account and status not in ('failed','cancelled') and created_at>=date_trunc('day',now()); if v_already_today+p_amount>v_daily_limit then raise exception 'daily_withdrawal_limit_exceeded'; end if; end if;
 select value_numeric into v_fee_pct from public.app_settings where key='withdrawal_fee_percent'; v_fee:=round(p_amount*coalesce(v_fee_pct,0)/100,2);
 if v_wallet.balance<p_amount then raise exception 'insufficient_balance'; end if;
 update public.wallets set balance=balance-p_amount,withdrawal_reserved=withdrawal_reserved+p_amount,updated_at=now() where id=v_wallet.id;
 begin
   insert into public.withdrawals(account_id,amount,fee_amount,provider,status,currency,idempotency_key) values(v_account,p_amount,v_fee,v_provider,'pending',upper(trim(coalesce(p_currency,'XOF'))),p_idempotency_key) returning * into v_w;
 exception when unique_violation then
   update public.wallets set balance=balance+p_amount,withdrawal_reserved=greatest(withdrawal_reserved-p_amount,0),updated_at=now() where id=v_wallet.id;
   if p_idempotency_key is not null then select * into v_existing from public.withdrawals where account_id=v_account and idempotency_key=p_idempotency_key limit 1; if found then return v_existing; end if; end if;
   raise;
 end;
 insert into public.wallet_ledger(account_id,wallet_id,entry_type,amount,balance_before,balance_after,locked_before,locked_after,description) values(v_account,v_wallet.id,'withdrawal_reserve',p_amount,v_wallet.balance,v_wallet.balance-p_amount,v_wallet.locked_balance,v_wallet.locked_balance,case when v_fee>0 then format('Withdrawal reserved (fee: %s %s payable on success)',v_fee,upper(trim(coalesce(p_currency,'XOF')))) else 'Withdrawal reserved pending provider payout' end);
 return v_w;
end;
$function$;

-- Serialize transaction creation per buyer account before checking the daily count.
create or replace function public.create_transaction_with_method(p_seller_phone text, p_seller_country text, p_description text, p_amount numeric, p_delivery_delay text default null, p_conditions text default null, p_provider_id uuid default null, p_payment_method_id uuid default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_account_id uuid; v_currency char(3); v_seller_id uuid; v_transaction_id uuid; v_min numeric; v_max numeric; v_maintenance boolean; v_kyc_threshold numeric; v_kyc_status text; v_max_per_day numeric; v_count_today int; f jsonb;
begin
 if auth.uid() is null then raise exception 'not_authenticated'; end if;
 select value_boolean into v_maintenance from public.app_settings where key='maintenance_mode'; if coalesce(v_maintenance,false) then raise exception 'maintenance_mode_active'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'invalid_amount'; end if; if length(trim(coalesce(p_description,'')))=0 then raise exception 'description_required'; end if;
 select value_numeric into v_min from public.app_settings where key='minimum_transaction_amount'; select value_numeric into v_max from public.app_settings where key='maximum_transaction_amount';
 if v_min is not null and p_amount<v_min then raise exception 'amount_below_minimum'; end if; if v_max is not null and p_amount>v_max then raise exception 'amount_above_maximum'; end if;
 select a.id,w.currency into v_account_id,v_currency from public.accounts a join public.wallets w on w.account_id=a.id where a.user_id=auth.uid() and a.is_active=true limit 1 for update of a;
 if v_account_id is null then raise exception 'account_not_found'; end if;
 select value_numeric into v_max_per_day from public.app_settings where key='max_transactions_per_day';
 if v_max_per_day is not null then select count(*) into v_count_today from public.transactions t where t.account_id=v_account_id and t.created_at>=date_trunc('day',now()); if v_count_today>=v_max_per_day then raise exception 'daily_transaction_limit_exceeded'; end if; end if;
 select value_numeric into v_kyc_threshold from public.app_settings where key='kyc_required_above_amount';
 if v_kyc_threshold is not null and p_amount>=v_kyc_threshold then select kyc_status into v_kyc_status from public.profiles where id=auth.uid(); if coalesce(v_kyc_status,'unverified')<>'verified' then raise exception 'kyc_verification_required'; end if; end if;
 select p.id into v_seller_id from public.profiles p where p.phone=p_seller_phone and p.role='seller' limit 1; if v_seller_id is null then raise exception 'seller_not_found_or_not_seller'; end if; if v_seller_id=auth.uid() then raise exception 'self_transaction_not_allowed'; end if;
 f:=public.calculate_transaction_fees(p_amount,v_currency,p_provider_id,p_payment_method_id);
 insert into public.transactions(account_id,seller_id,seller_phone,seller_country,description,amount,commission,currency,status,delivery_delay,conditions,provider_id,payment_method_id,provider_code,payment_method,fee_configuration_version,buyer_total,escrow_amount,seller_net) values(v_account_id,v_seller_id,p_seller_phone,p_seller_country,p_description,round(p_amount,2),(f->>'safepay_fee')::numeric,v_currency,'pending',p_delivery_delay,p_conditions,(f->>'provider_id')::uuid,(f->>'payment_method_id')::uuid,f->>'provider_code',f->>'payment_method',(f->>'configuration_version')::bigint,(f->>'buyer_total')::numeric,(f->>'escrow_amount')::numeric,(f->>'seller_net')::numeric) returning id into v_transaction_id;
 insert into public.transaction_fee_snapshots(transaction_id,gross_amount,provider_collection_fee,safepay_fee,payout_fee,total_customer_fee,buyer_total,escrow_amount,seller_gross,seller_net,provider_revenue,safepay_revenue,fee_payer,provider_id,payment_method_id,provider_code,payment_method,currency,configuration_version) values(v_transaction_id,(f->>'gross_amount')::numeric,(f->>'provider_collection_fee')::numeric,(f->>'safepay_fee')::numeric,(f->>'payout_fee')::numeric,(f->>'total_customer_fee')::numeric,(f->>'buyer_total')::numeric,(f->>'escrow_amount')::numeric,(f->>'seller_gross')::numeric,(f->>'seller_net')::numeric,(f->>'provider_revenue')::numeric,(f->>'safepay_revenue')::numeric,f->>'fee_payer',(f->>'provider_id')::uuid,(f->>'payment_method_id')::uuid,f->>'provider_code',f->>'payment_method',f->>'currency',(f->>'configuration_version')::bigint);
 insert into public.transaction_status_history(transaction_id,from_status,to_status,changed_by,reason) values(v_transaction_id,null,'pending',auth.uid(),'Transaction created; financial configuration snapshot recorded'); return v_transaction_id;
end;
$function$;

-- Let settle_deposit own the successful state transition and wallet credit; the webhook wrapper must not pre-mark the row successful.
create or replace function public.process_deposit_webhook(p_deposit_id uuid, p_provider text, p_provider_reference text, p_amount numeric, p_currency text, p_webhook_event_id text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare d public.deposits%rowtype;
begin
 if coalesce(trim(p_provider),'')='' or coalesce(trim(p_provider_reference),'')='' or coalesce(trim(p_webhook_event_id),'')='' then raise exception 'provider, provider reference and webhook event id are required'; end if;
 select * into d from public.deposits where id=p_deposit_id for update; if not found then raise exception 'deposit not found'; end if;
 if d.provider<>p_provider then raise exception 'provider mismatch'; end if; if d.amount<>p_amount then raise exception 'amount mismatch'; end if; if upper(coalesce(d.currency,''))<>upper(coalesce(p_currency,'')) then raise exception 'currency mismatch'; end if;
 if d.provider_reference is not null and d.provider_reference<>p_provider_reference then raise exception 'provider reference mismatch'; end if;
 if d.status='successful' then return jsonb_build_object('ok',true,'already_settled',true,'deposit_id',d.id); end if;
 if d.status<>'pending' and d.status<>'processing' then raise exception 'deposit_not_settleable'; end if;
 perform public.settle_deposit(d.id,p_provider_reference,true); return jsonb_build_object('ok',true,'already_settled',false,'deposit_id',d.id);
end;
$function$;