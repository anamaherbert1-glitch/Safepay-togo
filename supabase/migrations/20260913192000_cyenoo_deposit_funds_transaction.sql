-- Cyenoo: after a successful deposit settlement, if deposit is linked to a transaction
-- (paiement direct MM), lock the credited amount and mark the transaction funded.

create or replace function public.mark_transaction_funded_from_deposit(p_deposit_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  d public.deposits%rowtype;
  v_tx public.transactions%rowtype;
  v_wallet public.wallets%rowtype;
  v_total numeric;
begin
  select * into d from public.deposits where id = p_deposit_id;
  if not found then raise exception 'deposit_not_found'; end if;
  if d.status <> 'successful' then
    return jsonb_build_object('ok', false, 'reason', 'deposit_not_successful');
  end if;
  if d.transaction_id is null then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  select * into v_tx from public.transactions where id = d.transaction_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'transaction_not_found');
  end if;

  if v_tx.status = 'funded' and coalesce(v_tx.funding_status, '') = 'funded' then
    return jsonb_build_object('ok', true, 'already_funded', true);
  end if;

  if v_tx.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'transaction_not_pending');
  end if;

  v_total := coalesce(v_tx.buyer_total, v_tx.amount + coalesce(v_tx.commission, 0));

  -- Lock funds that were just credited to the buyer wallet by settle_deposit
  select * into v_wallet from public.wallets where account_id = v_tx.account_id for update;
  if v_wallet.id is not null and v_wallet.balance >= v_total then
    update public.wallets
    set balance = balance - v_total,
        locked_balance = locked_balance + v_total,
        updated_at = now()
    where id = v_wallet.id;

    begin
      insert into public.wallet_ledger (
        wallet_id, entry_type, amount, balance_after, description, reference_type, reference_id
      ) values (
        v_wallet.id, 'debit', v_total, v_wallet.balance - v_total,
        'Escrow Cyenoo — financement MM direct', 'transaction', v_tx.id
      );
    exception when others then
      null;
    end;
  end if;

  update public.transactions
  set status = 'funded',
      funding_status = 'funded',
      updated_at = now()
  where id = v_tx.id;

  insert into public.transaction_status_history (
    transaction_id, from_status, to_status, changed_by, reason
  ) values (
    v_tx.id, 'pending', 'funded', null,
    'Funded via direct Mobile Money (deposit ' || p_deposit_id::text || ')'
  );

  return jsonb_build_object('ok', true, 'transaction_id', v_tx.id, 'status', 'funded');
end;
$function$;

revoke all on function public.mark_transaction_funded_from_deposit(uuid) from public;
grant execute on function public.mark_transaction_funded_from_deposit(uuid) to service_role;

-- Hook into deposit webhook: settle then fund linked transaction
create or replace function public.process_deposit_webhook(
  p_deposit_id uuid,
  p_provider text,
  p_provider_reference text,
  p_amount numeric,
  p_currency text,
  p_webhook_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  d public.deposits%rowtype;
  v_fund jsonb;
  v_already boolean := false;
begin
  if coalesce(trim(p_provider), '') = ''
     or coalesce(trim(p_provider_reference), '') = ''
     or coalesce(trim(p_webhook_event_id), '') = '' then
    raise exception 'provider, provider reference and webhook event id are required';
  end if;

  select * into d from public.deposits where id = p_deposit_id for update;
  if not found then raise exception 'deposit not found'; end if;
  if d.provider <> p_provider then raise exception 'provider mismatch'; end if;
  if d.amount <> p_amount then raise exception 'amount mismatch'; end if;
  if upper(coalesce(d.currency, '')) <> upper(coalesce(p_currency, '')) then
    raise exception 'currency mismatch';
  end if;
  if d.provider_reference is not null and d.provider_reference <> p_provider_reference then
    raise exception 'provider reference mismatch';
  end if;

  if d.status = 'successful' then
    v_already := true;
  else
    if d.status <> 'pending' and d.status <> 'processing' then
      raise exception 'deposit_not_settleable';
    end if;
    perform public.settle_deposit(d.id, p_provider_reference, true);
  end if;

  -- Cyenoo: if this deposit funds a transaction (direct_mm), lock + mark funded
  v_fund := public.mark_transaction_funded_from_deposit(p_deposit_id);

  return jsonb_build_object(
    'ok', true,
    'already_settled', v_already,
    'deposit_id', p_deposit_id,
    'transaction_funding', v_fund
  );
end;
$function$;
