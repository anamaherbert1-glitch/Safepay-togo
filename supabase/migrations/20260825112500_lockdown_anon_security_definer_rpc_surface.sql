do $$
declare r record;
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prosecdef
      and has_function_privilege('anon',p.oid,'EXECUTE')
      and p.proname not in ('get_public_settings','is_feature_enabled','get_active_payment_methods','calculate_transaction_fees')
  loop
    execute format('revoke execute on function public.%I(%s) from anon',r.proname,r.args);
    execute format('revoke execute on function public.%I(%s) from public',r.proname,r.args);
  end loop;
end $$;