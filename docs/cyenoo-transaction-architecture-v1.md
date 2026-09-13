# Cyenoo — Architecture transactions V1 (Mobile Money national + escrow)

## Objectif

Flux de paiement sécurisé **Mobile Money uniquement**, **dans un seul pays** (Togo↔Togo, Burkina↔Burkina), avec **escrow Cyenoo** :

1. L’acheteur choisit **wallet** ou **paiement direct MM**
2. Il saisit le **destinataire** (numéro + opérateur MM du même pays)
3. L’argent est **prélevé** puis **bloqué** dans Cyenoo
4. Le destinataire est **notifié**
5. Après **validation**, le destinataire peut **retirer** sur son Mobile Money

Pas de carte bancaire. Pas d’envoi inter-pays.

## Acteurs

| Acteur | Rôle |
|--------|------|
| Acheteur | Crée la transaction, paie (wallet ou MM direct) |
| Destinataire | Reçoit la notification ; retire après validation |
| Cyenoo (backend) | Escrow, statuts, frais, notifications, règles pays |
| Prestataire (ex. CinetPay) | Collect MM + payout MM (y compris T-Money → Moov dans le même pays) |

## Modes de paiement acheteur

### `wallet`
- Solde déjà sur le wallet Cyenoo (rechargé au préalable via MM).
- Au funding : débit wallet + `locked_balance` (escrow).
- Statut transaction → `funded`.

### `direct_mm`
- Pas de passage obligatoire par le wallet utilisateur.
- Collect Mobile Money (T-Money / Moov selon le pays) via le prestataire.
- À la confirmation webhook → fonds en escrow → `funded`.

## Destinataire

- **Toujours Mobile Money** : numéro E.164 + opérateur (`T-Money` ou `Moov Money`).
- **Même pays** que le circuit de la transaction (`TG` ou `BF`).
- Opérateurs différents dans le **même pays** : OK (ex. acheteur T-Money, destinataire Moov) — géré par le prestataire.
- Si un profil Cyenoo existe pour ce numéro → `seller_id` renseigné ; sinon numéro seul, payout au retrait.

## Cycle de vie (statuts)

```
pending  →  funded  →  delivered  →  completed
                ↘ disputed
pending / funded → cancelled
```

| Statut | Signification |
|--------|----------------|
| `pending` | TX créée, pas encore financée |
| `funded` | Fonds bloqués (escrow) |
| `delivered` | Destinataire / vendeur confirme la livraison / exécution |
| `completed` | Acheteur valide → **payout MM** vers le destinataire |
| `disputed` | Litige ouvert |
| `cancelled` | Annulée (règles métier) |

## Pays & opérateurs V1

| Pays | Code | Opérateurs |
|------|------|------------|
| Togo | `TG` | T-Money, Moov Money |
| Burkina Faso | `BF` | Orange Money, Moov Money |

Feature flags :

- `card_payments_enabled` = **false**
- `cross_border_enabled` = **false** (nouveau)
- `deposits_enabled`, `withdrawals_enabled`, `transfers_enabled` inchangés

## Tables / colonnes (migration)

Sur `public.transactions` (additif) :

- `payment_source` : `wallet` \| `direct_mm`
- `recipient_operator` : opérateur MM du destinataire
- `buyer_operator` : opérateur MM acheteur (direct ou recharge)
- `funding_status` : `unfunded` \| `funding` \| `funded` \| `failed`
- `corridor_country` : `TG` \| `BF` (pays unique de la TX)

Index utiles sur `(account_id, created_at)`, `(seller_phone)`, `(status, funding_status)`.

## RPCs principales

| RPC | Rôle |
|-----|------|
| `create_cyenoo_transaction(...)` | Crée TX pending + snapshot frais ; MM only ; même pays |
| `fund_transaction_from_wallet(p_transaction_id)` | Débit wallet → escrow → `funded` |
| `create_transaction_mm_collect_intent(...)` | Intent collect direct MM lié à la TX |
| `transition_transaction(...)` | Transitions métier (existant) |
| `open_dispute(...)` | Litige (existant) |

Le funding wallet réutilise la logique escrow déjà validée (locked_balance / ledger).
Le collect direct s’appuie sur deposits + webhook, puis marque la TX `funded`.

## Notifications

À chaque passage clé (`funded`, `delivered`, `completed`, litige) :

- notification in-app si table présente
- SMS (edge `transaction-action` + `bird-sms`) — libellés **Cyenoo**

## Frontend

Écran `/transactions/new` :

1. Mode : Wallet | Paiement direct MM
2. Pays corridor (TG / BF)
3. Destinataire : téléphone + opérateur
4. Montant + description (+ délai / conditions optionnels)
5. Récap frais → confirmer

## Hors scope V1

- Carte Visa/Mastercard
- Compte bancaire destinataire
- Cross-border (Togo↔Burkina, etc.)
- Gozem Money (sauf activation prestataire ultérieure)

## Migration Supabase

Fichier : `supabase/migrations/20260913190000_cyenoo_mm_escrow_architecture.sql`

À appliquer sur le projet Supabase (CLI `supabase db push` / SQL Editor).
Les tables historiques (`safepay_fee_settings`, etc.) restent la source de vérité frais ; seuls les libellés UI sont Cyenoo.
