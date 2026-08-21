# SafePay V5 — Wallet / Transaction / Payment Test Report

Date: 2026-08-21

## Verified against Supabase

Project: `Safepay-togo` (`cpbxbpyvpgtyvlfnpqsq`)

All mutation tests below were executed inside database transactions and rolled back. No test transaction, deposit, withdrawal or dispute was left in production data.

### Wallet
- `get_my_wallet()` returns the authenticated user's wallet.
- Wallet currency is XOF for the tested account.
- Ledger is read from `wallet_ledger`.

### Transaction / Escrow
- `create_transaction()` creates a pending transaction.
- Funding moves `amount + commission` from available balance to locked balance.
- Commission is read from `app_settings.commission_rate_percent` (currently 2%).
- Seller can mark a funded transaction as delivered.
- Buyer can complete a delivered transaction.
- Completion releases the locked total and credits the seller amount.
- Insufficient balance is rejected.
- Direct invalid transitions are rejected.
- A buyer cannot mark a transaction delivered.
- Direct `funded -> disputed` is rejected; disputes must use `open_dispute()`.

### Disputes
- A participant can open a dispute from funded/delivered state.
- Duplicate dispute attempts on an already disputed transaction are rejected.
- Admin refund resolution restores the buyer wallet and cancels the transaction.
- Admin seller-release resolution completes the transaction, releases buyer escrow and credits the seller.

### Deposits
- Deposit idempotency works.
- Successful settlement credits the wallet through `settle_deposit()`.

### Withdrawals
- Withdrawal reservation decreases available balance and increases `withdrawal_reserved`.
- Repeating the same idempotency key returns the existing withdrawal.
- Failed settlement restores the reserved amount to available balance.

## Changes made

- Added SafePay V5 recharge UI connected to `cinetpay-deposit`.
- Added SafePay V5 withdrawal UI connected to `cinetpay-withdraw`.
- Added Wallet quick actions for recharge and withdrawal.
- Added ledger labels for deposit/withdrawal entries.
- Corrected `cinetpay-withdraw` so CinetPay initialization/auth failures refund the withdrawal reservation instead of leaving funds reserved.
- Tightened CinetPay deposit and payout webhook authentication to fail closed when the webhook secret is missing or invalid.
- Webhook event logging now fails closed instead of silently continuing when event persistence fails.
- Revoked public/anonymous execution of `mark_notification_read()` while keeping it available to authenticated users.

## Still not declared production-ready

- CinetPay live credentials/merchant configuration still require confirmation and real provider tests.
- Bird SMS/WhatsApp still requires real credential/provider verification.
- Browser end-to-end testing on a deployed build remains to be performed.
- KYC and dedicated anti-fraud/risk engine remain separate unfinished work.
