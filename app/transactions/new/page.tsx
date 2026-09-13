"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";
import { CYENOO_CORRIDORS, CorridorCountry, PaymentSource, operatorsForCountry } from "@/lib/mm-operators";

type Fees = {
  gross_amount: number;
  provider_collection_fee: number;
  safepay_fee: number;
  payout_fee: number;
  total_customer_fee: number;
  buyer_total: number;
  escrow_amount: number;
  seller_net: number;
  fee_payer: "buyer" | "seller" | "split";
};

const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

export default function NewTransactionPage() {
  const router = useRouter();
  const [paymentSource, setPaymentSource] = useState<PaymentSource>("wallet");
  const [corridor, setCorridor] = useState<CorridorCountry>("TG");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientOperator, setRecipientOperator] = useState("");
  const [buyerOperator, setBuyerOperator] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryDelay, setDeliveryDelay] = useState("");
  const [conditions, setConditions] = useState("");
  const [fees, setFees] = useState<Fees | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [error, setError] = useState("");

  const operators = useMemo(() => operatorsForCountry(corridor), [corridor]);

  useEffect(() => {
    setRecipientOperator("");
    setBuyerOperator("");
  }, [corridor]);

  useEffect(() => {
    const run = async () => {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setFees(null);
        return;
      }
      setLoadingFees(true);
      const s = createClient();
      const { data, error: e } = await s.rpc("calculate_transaction_fees", {
        p_amount: n,
        p_currency: "XOF",
        p_provider_id: null,
        p_payment_method_id: null,
      });
      setLoadingFees(false);
      if (!e) setFees(data as Fees);
    };
    const id = setTimeout(run, 180);
    return () => clearTimeout(id);
  }, [amount]);

  function countryDial(code: CorridorCountry) {
    return SAFE_PAY_COUNTRIES.find((c) => c.code === code);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const n = Number(amount);
    const countryMeta = countryDial(corridor);
    const phoneResult = countryMeta
      ? validatePhone(countryMeta.code, recipientPhone)
      : { valid: false as const, e164: "", reason: "Pays invalide." };

    if (!phoneResult.valid) {
      setError(phoneResult.reason);
      return;
    }
    if (!recipientOperator) {
      setError("Choisissez l'opérateur Mobile Money du destinataire.");
      return;
    }
    if (paymentSource === "direct_mm" && !buyerOperator) {
      setError("Choisissez l'opérateur Mobile Money pour le paiement direct.");
      return;
    }
    if (!description.trim() || !Number.isFinite(n) || n <= 0) {
      setError("Vérifiez la description et le montant.");
      return;
    }

    setBusy(true);
    try {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) throw new Error("Session expirée. Reconnectez-vous.");

      const recipientLabel =
        operators.find((o) => o.code === recipientOperator)?.label ?? recipientOperator;
      const buyerLabel =
        operators.find((o) => o.code === buyerOperator)?.label ?? buyerOperator;

      const { data: id, error: e } = await s.rpc("create_cyenoo_transaction", {
        p_recipient_phone: phoneResult.e164,
        p_corridor_country: corridor,
        p_recipient_operator: recipientLabel,
        p_payment_source: paymentSource,
        p_description: description.trim(),
        p_amount: n,
        p_delivery_delay: deliveryDelay.trim() || null,
        p_conditions: conditions.trim() || null,
        p_buyer_operator: paymentSource === "direct_mm" ? buyerLabel : null,
        p_provider_id: null,
        p_payment_method_id: null,
      });
      if (e) throw e;

      const txId = id as string;

      if (paymentSource === "wallet") {
        const { error: fundErr } = await s.rpc("fund_transaction_from_wallet", {
          p_transaction_id: txId,
        });
        if (fundErr) {
          router.replace(`/transactions/${txId}?fund=wallet&error=${encodeURIComponent(fundErr.message)}`);
          return;
        }
      } else {
        const { data: deposit, error: depErr } = await s.rpc("create_transaction_mm_collect_intent", {
          p_transaction_id: txId,
          p_idempotency_key: `tx-collect-${txId}`,
        });
        if (depErr) {
          router.replace(`/transactions/${txId}?fund=direct&error=${encodeURIComponent(depErr.message)}`);
          return;
        }
        router.replace(`/transactions/${txId}?fund=direct&deposit=${(deposit as { id?: string })?.id ?? ""}`);
        return;
      }

      router.replace(`/transactions/${txId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la transaction.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sp-page">
      <div className="sp-page-head">
        <div>
          <p className="sp-eyebrow">Cyenoo</p>
          <h1 className="sp-title">Nouvelle transaction</h1>
          <p className="sp-muted" style={{ marginTop: 6 }}>
            Mobile Money · même pays · fonds protégés jusqu&apos;à validation
          </p>
        </div>
      </div>

      <form className="sp-form" onSubmit={submit}>
        <section className="sp-section-card">
          <h2>1. Comment payez-vous ?</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <label style={{ display: "flex", gap: 12, padding: 14, borderRadius: 14, border: paymentSource === "wallet" ? "1.5px solid #3b82f6" : "1px solid rgba(148,163,184,.2)", cursor: "pointer" }}>
              <input type="radio" name="paymentSource" checked={paymentSource === "wallet"} onChange={() => setPaymentSource("wallet")} />
              <span>
                <strong>Paiement par wallet</strong><br />
                <small className="sp-muted">Utilise le solde Cyenoo. Rechargez d&apos;abord si besoin.</small>
              </span>
            </label>
            <label style={{ display: "flex", gap: 12, padding: 14, borderRadius: 14, border: paymentSource === "direct_mm" ? "1.5px solid #3b82f6" : "1px solid rgba(148,163,184,.2)", cursor: "pointer" }}>
              <input type="radio" name="paymentSource" checked={paymentSource === "direct_mm"} onChange={() => setPaymentSource("direct_mm")} />
              <span>
                <strong>Paiement direct Mobile Money</strong><br />
                <small className="sp-muted">Prélèvement immédiat sur T-Money / Moov / Orange (selon le pays).</small>
              </span>
            </label>
          </div>
        </section>

        <section className="sp-section-card" style={{ marginTop: 12 }}>
          <h2>2. Destinataire (Mobile Money)</h2>
          <label>
            Pays
            <select value={corridor} onChange={(e) => setCorridor(e.target.value as CorridorCountry)}>
              {CYENOO_CORRIDORS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>
          <p className="sp-muted" style={{ fontSize: 12, marginTop: 4 }}>
            Les envois se font uniquement entre numéros du même pays.
          </p>
          <label style={{ marginTop: 12 }}>
            Numéro du destinataire
            <input inputMode="tel" autoComplete="tel" placeholder={corridor === "TG" ? "90 00 00 00" : "70 00 00 00"} value={recipientPhone} onChange={(e) => setRecipientPhone(onlyPhoneCharacters(e.target.value))} />
          </label>
          <label>
            Opérateur du destinataire
            <select value={recipientOperator} onChange={(e) => setRecipientOperator(e.target.value)}>
              <option value="">Choisir…</option>
              {operators.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </label>
          {paymentSource === "direct_mm" && (
            <label>
              Votre opérateur (paiement)
              <select value={buyerOperator} onChange={(e) => setBuyerOperator(e.target.value)}>
                <option value="">Choisir…</option>
                {operators.map((o) => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </label>
          )}
        </section>

        <section className="sp-section-card" style={{ marginTop: 12 }}>
          <h2>3. Détails de la transaction</h2>
          <label>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex. Achat téléphone, service, etc." required />
          </label>
          <label>
            Montant (XOF)
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" required />
          </label>
          <label>
            Délai de livraison (optionnel)
            <input value={deliveryDelay} onChange={(e) => setDeliveryDelay(e.target.value)} placeholder="Ex. 48 h" />
          </label>
          <label>
            Conditions (optionnel)
            <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} placeholder="Conditions convenues entre les parties" />
          </label>
        </section>

        {loadingFees && <p className="sp-muted">Calcul des frais…</p>}
        {fees && (
          <section className="sp-section-card" style={{ marginTop: 12 }}>
            <h2>Récapitulatif</h2>
            <div className="sp-detail-grid">
              <div><span>Montant</span><strong>{money(fees.gross_amount)}</strong></div>
              <div><span>Protection Cyenoo</span><strong>{money(fees.safepay_fee)}</strong></div>
              <div><span>Total à payer</span><strong>{money(fees.buyer_total)}</strong></div>
              <div><span>Bloqué (escrow)</span><strong>{money(fees.escrow_amount)}</strong></div>
              <div><span>Destinataire recevra</span><strong>{money(fees.seller_net)}</strong></div>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "#8094aa" }}>
              L&apos;argent reste bloqué dans Cyenoo jusqu&apos;à validation. Le destinataire est notifié, puis peut retirer sur Mobile Money après confirmation.
            </p>
          </section>
        )}

        {error && <p className="sp-form-error" role="alert">{error}</p>}

        <div className="sp-inline-actions" style={{ marginTop: 16 }}>
          <button type="button" className="sp-secondary-button" onClick={() => router.back()} disabled={busy}>Retour</button>
          <button type="submit" className="safepay-primary cyenoo-primary" disabled={busy}>
            {busy ? "Traitement…" : paymentSource === "wallet" ? "Créer et sécuriser (wallet)" : "Créer et payer (Mobile Money)"}
          </button>
        </div>
      </form>
    </main>
  );
}
