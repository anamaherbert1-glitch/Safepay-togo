# SafePay V5 Migration Matrix

## Source of truth
- Frontend reference: `index-v5-final.html` from the existing SafePay V5 work.
- Backend source of truth: existing Supabase project/schema and existing Edge Functions.
- Target frontend: Next.js + TypeScript.

## Current verified status
- Wallet balance and locked balance are read from `get_my_wallet()`.
- Wallet ledger history is read from `wallet_ledger` under RLS.
- Transaction list, creation, detail, status history, escrow transitions and dispute opening are connected to the existing Supabase RPCs.
- Financial state is not intentionally sourced from localStorage in the migrated wallet/transaction paths.
- Supabase RLS is enabled on the audited financial/product tables.
- `mark_notification_read` was hardened so anonymous callers no longer have EXECUTE permission.
- The production payment path is still not considered verified until CinetPay credentials, callbacks, signatures and live/sandbox behavior are tested.

## Screen-by-screen migration checklist

| Area | Current status | Next action |
|---|---|---|
| App shell/navigation | PARTIALLY IMPLEMENTED | Finish history-aware back handling and modal behavior audit |
| Welcome | PARTIALLY IMPLEMENTED | Finish V5 visual extraction |
| Email/Google/password auth | PARTIALLY IMPLEMENTED | Complete real end-to-end Auth verification |
| Country/phone/OTP | PARTIALLY IMPLEMENTED | Verify real SMS/OTP provider, cooldowns and rate limits |
| Profile/account | PARTIALLY IMPLEMENTED | Complete profile/account onboarding verification |
| Wallet | IMPLEMENTED | Add real deposit/withdraw UI after provider validation |
| Wallet ledger | IMPLEMENTED | Continue reconciliation tests |
| Transactions | IMPLEMENTED | Run authenticated buyer/seller lifecycle tests |
| Escrow | IMPLEMENTED in backend | Run full lock/release/refund/dispute acceptance tests |
| Transaction history | IMPLEMENTED | Verify every transition produces expected history |
| Disputes | PARTIALLY IMPLEMENTED | Connect complete user + Admin resolution UI |
| Notifications | PARTIALLY IMPLEMENTED | Verify event generation and unread/read UX |
| Deposits | PARTIALLY IMPLEMENTED | Connect UI to deposit intent + CinetPay flow and test webhook |
| Withdrawals | PARTIALLY IMPLEMENTED | Connect UI to withdrawal intent + payout webhook and test failure/retry |
| CinetPay | PARTIALLY IMPLEMENTED | Verify secrets, merchant settings, callbacks, signatures and idempotency |
| Bird SMS/WhatsApp | PARTIALLY IMPLEMENTED | Verify credentials, real send/verify flow and abuse controls |
| Invoices | PARTIALLY IMPLEMENTED | Connect `transaction_invoices` + `generate-invoice-pdf` to UI |
| Support | PARTIALLY IMPLEMENTED | Build user ticket/message UI and connect existing admin RPCs |
| Feedback | PARTIALLY IMPLEMENTED | Build/verify user submission UI |
| App rating | PARTIALLY IMPLEMENTED | Correct semantics and connect rating UI |
| Admin dashboard | PARTIALLY IMPLEMENTED | Migrate the existing Admin HTML into a separate Next.js app |
| Admin settings/commissions | BACKEND IMPLEMENTED | Connect Admin UI to `admin_set_app_setting` and audit changes |
| Feature flags | BACKEND IMPLEMENTED | Connect Admin UI and verify application behavior |
| Audit logs | BACKEND IMPLEMENTED | Surface relevant logs in Admin UI |
| Security/RLS | PARTIALLY IMPLEMENTED | Complete function privilege/RLS/advisor audit |
| Production deployment | NOT IMPLEMENTED | Vercel project + environment configuration + production testing |

## Important backend findings
- `transactions` enforces positive amounts, commission bounds and allowed statuses.
- `wallets` enforces non-negative available/locked/reserved balances.
- `payment_webhook_events` has a unique `(provider,event_id)` constraint for idempotency.
- Deposits and withdrawals have idempotency keys and unique provider references.
- Transaction financial transitions are performed inside `transition_transaction()`; the frontend does not directly mutate wallet balances.
- `resolve_dispute()` is admin-protected and performs the corresponding refund/release accounting.

## Known verification limits
- Existing test data contains 6 transactions, 4 wallets and 16 ledger entries; this is useful for read-path testing but is not a substitute for a clean end-to-end sandbox test.
- No CinetPay webhook events are currently recorded in `payment_webhook_events`, so real webhook processing has not been demonstrated in this audit.
- No invoices, support tickets, feedback or ratings currently exist in the database, so those UI paths still need functional testing with authenticated test data.

## Next implementation gate
**Gate 3 — Wallet + Transactions + Escrow acceptance testing**

1. Authenticated buyer creates a transaction.
2. Buyer funds it and wallet available/locked balances change through the backend.
3. Seller marks delivery.
4. Buyer confirms and escrow releases seller funds plus platform commission.
5. Buyer or seller opens a dispute.
6. Admin resolves to buyer refund or seller release.
7. Ledger and transaction status history reflect every financial transition.
8. Unauthorized users are rejected by backend authorization.
9. Double-click/network retry does not create duplicate financial effects.

After Gate 3, proceed to **Gate 4 — Deposits/Withdrawals/CinetPay/Bird**.