# SafePay — Architecture des commissions

## Source de vérité

`public.safepay_fee_settings` est l'unique source de vérité pour les règles de commission SafePay. Les paramètres financiers ne doivent pas être pilotés par `app_settings` ni codés en dur dans le frontend.

## Flux

Dashboard Admin → `admin_update_financial_settings()` → `safepay_fee_settings` (nouvelle version) → `calculate_transaction_fees()` → snapshot des frais de la transaction → Ledger / revenus SafePay.

## Règles

- Le dashboard permet de définir le pourcentage, le fixe, le minimum, le maximum et le payeur (`buyer`, `seller`, `split`).
- Chaque modification crée une nouvelle version et conserve l'historique.
- Les transactions historiques ne doivent jamais être recalculées avec une configuration future.
- `calculate_transaction_fees()` est le moteur central et calcule séparément les frais SafePay et les frais des prestataires.
- Les frais acheteur et vendeur sont exposés séparément afin que l'interface transactionnelle puisse expliquer clairement à chaque partie pourquoi elle paie.
- Le Dashboard Admin lit la configuration via `admin_get_financial_settings()` et non via une valeur locale.
- Les actions financières admin sont protégées par `is_admin()` et les fonctions sensibles ne sont pas exécutables par `anon`.

## Finance Admin

`/admin/financial` centralise :

- configuration des commissions ;
- simulateur utilisant le même moteur backend que les transactions ;
- analytics financiers ;
- frais plateforme ;
- ledger des revenus SafePay ;
- retraits des revenus SafePay ;
- prestataires et méthodes de paiement.
