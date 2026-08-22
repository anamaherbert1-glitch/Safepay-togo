# SafePay Togo — V5 Migration

SafePay V5 is the master product version. This repository is the migration target for the existing V5 frontend and existing Supabase backend.

## Rules
- Preserve V5 UI/UX and business logic.
- Do not rebuild the financial backend.
- Migrate progressively to Next.js + TypeScript.
- Supabase remains the source of truth.
- Remove financial/localStorage state progressively.
- Reuse existing tables, RPCs and Edge Functions.
- Registration: email/Google → password → phone → country/format validation → uniqueness → OTP → verified phone → profile.
- Phone format validation is not ownership verification; OTP must succeed before the phone is considered verified.
- Modals/bottom sheets have their own visible back button.
- Back navigation follows history and does not blindly return Home.
- Profile uses a person/head icon inside a circle, with the same color, size and alignment system as other SafePay icons; no special blue/purple background.

## Current phase
V5 migration with real Supabase-backed profile, wallet, transaction, notification, support, feedback and admin configuration flows.

## CI validation
Temporary branch used to validate the authentication build fix.
