# SafePay V5 → Next.js migration

## Source of truth
`index-v5-final.html` remains the historical visual/UX reference. The production app remains the existing Next.js application and its Supabase backend.

## Rules
- Preserve the V5 visual language; do not replace the application with a new prototype.
- Supabase is the source of truth for financial data.
- Do not use localStorage or React state as a financial ledger.
- Existing transaction/escrow RPCs remain authoritative.
- Deposits, withdrawals, phone OTP provider integration, and CinetPay remain out of scope for this migration pass.

## Integration order
1. Home/dashboard
2. Profile
3. Wallet
4. Transactions
5. Transaction detail / escrow
6. Navigation/modals
7. Litiges + notifications
8. Invoices + support
9. Admin/security
10. Mobile/E2E validation

## Current implementation note
The existing Next.js screens already consume Supabase for profile, wallet and transaction data. Migration is therefore an incremental convergence of UI/UX rather than a destructive replacement of the current app.
