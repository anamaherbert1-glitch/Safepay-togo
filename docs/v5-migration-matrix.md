# SafePay V5 Migration Matrix

## Source of truth
- Frontend reference: `index-v5-final.html` from the existing SafePay V5 work.
- Backend source of truth: existing Supabase project/schema and existing Edge Functions.
- Target frontend: Next.js + TypeScript.

## Migration rules
- Preserve V5 visual design and business behavior.
- Do not recreate the Supabase financial schema.
- Replace browser/local financial state with Supabase progressively.
- Keep existing Edge Functions and RPCs where they already cover the operation.
- Registration order: email/Google -> password -> phone -> country/format validation -> uniqueness -> OTP -> verified phone -> profile/account.
- A valid format is not proof of ownership; OTP verification is required.
- Modal/bottom-sheet back buttons close only the modal.
- Global back navigation follows history; it must not always return to Home.
- Profile icon is a person/head inside a circle, with the same size/alignment/color system as the other navigation icons and no special colored background.

## Screen-by-screen migration checklist

| Area | V5 reference | Target | Current status | Next action |
|---|---|---|---|---|
| App shell/navigation | HTML V5 | Next.js layout/router | Started | Extract navigation and history behavior |
| Welcome | HTML V5 | React page/component | Pending | Extract exact UI |
| Sign up email | HTML V5 | Supabase Auth | Pending | Implement mandatory first auth step |
| Google Auth | HTML V5 | Supabase Auth OAuth | Partial | Verify callback/session/profile creation |
| Password | HTML V5 | Supabase Auth | Pending | Implement validation and flow |
| Country/phone | HTML V5 | React + phone validation | Partial | Implement country-aware E.164 validation |
| OTP | HTML V5 + Bird functions | Supabase Edge Function/Bird | Partial | Connect real send/verify/rate limits |
| Profile | HTML V5 | profiles | Pending | Connect authenticated profile |
| Account | Existing Supabase | accounts | Pending | Link auth user/profile/account |
| Wallet | HTML V5/local state | wallets | Pending | Remove local financial source |
| Ledger | Existing Supabase | wallet_ledger | Pending | Read through secure backend/RPC |
| Transactions | HTML V5 | transactions/RPCs | Partial | Replace local branches |
| Transaction history | HTML V5 | transaction_status_history | Pending | Connect real history |
| Deposits | HTML V5 | deposits + CinetPay | Partial | Validate end-to-end |
| Withdrawals | HTML V5 | withdrawals + CinetPay | Partial | Validate end-to-end |
| Notifications | HTML V5 | notifications | Pending | Connect real records |
| Support | HTML V5 | support_tickets/messages | Partial | Connect CRUD securely |
| Feedback | HTML V5 | feedback | Partial | Connect submit/read behavior |
| App rating | HTML V5 | app_ratings | Partial | Correct rating semantics |
| Invoices | HTML V5 | transaction_invoices + PDF function | Partial | Replace local text invoice |
| Disputes | HTML V5 | disputes + admin function | Partial | Connect user/admin flow |
| Security | V5 + Supabase | RLS/functions/auth | Pending | Audit before production |
| Admin | Admin HTML prototype | Next.js Admin | Partial | Migrate after core user app |

## Phase gates

### Gate 0 — Inventory
This document establishes the migration matrix. No feature is considered migrated until its source, target and acceptance test are identified.

### Gate 1 — Next.js foundation
Complete app shell, routing/history, shared UI primitives, Supabase client and environment handling.

### Gate 2 — Authentication
Complete email/Google/password/phone/OTP and account/profile creation.

### Gate 3 — Wallet and transactions
Complete real wallet reads and transaction lifecycle using existing Supabase logic.

### Gate 4 — Payments
Validate CinetPay/Bird in sandbox, then production configuration later.

### Gate 5 — Product features
Notifications, support, feedback, ratings, invoices, disputes.

### Gate 6 — Security and Admin
RLS/function audit, Admin application, audit logs.

### Gate 7 — End-to-end testing
Test all critical flows before deployment.
