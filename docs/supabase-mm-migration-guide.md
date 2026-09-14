# Cyenoo — Guide migration Supabase (Mobile Money)

## Migrations à appliquer (dans l'ordre)

| Fichier | Rôle |
|---------|------|
| `20260825112000_security_hardening_idempotency_and_webhook.sql` | Sécurité / idempotence / webhooks |
| `20260825112500_lockdown_anon_security_definer_rpc_surface.sql` | Lockdown RPC anon |
| `20260913190000_cyenoo_mm_escrow_architecture.sql` | Escrow MM, TX wallet/direct_mm, RPCs core |
| `20260913192000_cyenoo_deposit_funds_transaction.sql` | Lien deposit → funding TX |
| **`20260914120000_cyenoo_mm_multi_country_operators.sql`** | **Multi-pays + tous opérateurs + logos** |

## Comment appliquer

### Option A — CLI Supabase
```bash
npx supabase db push
# ou
npx supabase migration up
```

### Option B — SQL Editor (Dashboard)
1. Ouvrir **Supabase → SQL Editor**
2. Coller le contenu de chaque fichier **dans l'ordre**
3. Exécuter

### Option C — CI / production
Lier le projet Vercel + Supabase et déployer les migrations via pipeline.

## RPCs exposées (après migration)

| RPC | Usage |
|-----|--------|
| `get_mm_operators(p_country)` | Liste opérateurs actifs d'un pays |
| `create_cyenoo_transaction(...)` | Crée TX (wallet ou direct_mm) |
| `fund_transaction_from_wallet(id)` | Escrow depuis solde |
| `create_transaction_mm_collect_intent(id, key)` | Intent collect prestataire |
| `create_deposit_intent(...)` | Recharge wallet |
| `mark_transaction_funded_from_deposit(id)` | Webhook → TX funded |
| `process_deposit_webhook(...)` | Settlement + funding |

## Pays / opérateurs seedés

| Code | Pays | Opérateurs |
|------|------|------------|
| TG | Togo | Mixx by Yas, Moov Money |
| BF | Burkina Faso | Orange Money, Moov Money |
| BJ | Bénin | MTN MoMo, Moov Money |
| CI | Côte d'Ivoire | Orange, MTN, Moov, Wave |
| SN | Sénégal | Orange, Free Money, Wave |
| ML | Mali | Orange, Moov |
| NE | Niger | Orange, Airtel Money |

## Edge functions à déployer

```bash
npx supabase functions deploy cinetpay-deposit
npx supabase functions deploy cinetpay-withdraw
npx supabase functions deploy transaction-action
```

## Secrets requis

- `CINETPAY_SITE_ID`
- `CINETPAY_APIKEY` (ou `CINETPAY_API_KEY`)
- `CINETPAY_NOTIFY_URL` (optionnel)
- `SUPABASE_SERVICE_ROLE_KEY` (auto en edge)

## Vérification post-migration

```sql
-- Opérateurs actifs
select * from public.v_mm_operators_active;

-- Togo
select * from public.get_mm_operators('TG');

-- Colonnes TX
select column_name from information_schema.columns
where table_name = 'transactions'
  and column_name in ('payment_source','funding_status','corridor_country','recipient_operator','buyer_operator');
```
