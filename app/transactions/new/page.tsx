"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

export default function NewTransactionPage() {
  const router = useRouter();
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerCountry, setSellerCountry] = useState("TG");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryDelay, setDeliveryDelay] = useState("");
  const [conditions, setConditions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const numericAmount = Number(amount);
    const country = SAFE_PAY_COUNTRIES.find(c => c.code === sellerCountry);
    const phoneResult = country ? validatePhone(country.code, sellerPhone) : { valid: false as const, e164: "", reason: "Pays invalide." };
    if (!phoneResult.valid || !description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(phoneResult.valid ? "Vérifiez la description et le montant." : phoneResult.reason);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée. Reconnectez-vous.");
      const { data: transactionId, error: rpcError } = await supabase.rpc("create_transaction", {
        p_seller_phone: phoneResult.e164,
        p_seller_country: country?.code ?? sellerCountry,
        p_description: description.trim(),
        p_amount: numericAmount,
        p_delivery_delay: deliveryDelay.trim() || null,
        p_conditions: conditions.trim() || null,
      });
      if (rpcError) throw rpcError;
      router.replace(`/transactions/${transactionId}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de créer la transaction."); }
    finally { setBusy(false); }
  }

  return <main className="safepay-shell safepay-dashboard">
    <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Nouvelle transaction</strong><span style={{ width: 36 }} /></header>
    <section className="sp-content"><p className="sp-eyebrow">Escrow SafePay</p><h1 className="sp-title">Créer une transaction sécurisée</h1>
      <form className="sp-form" onSubmit={submit}>
        <label>Pays du vendeur<select value={sellerCountry} onChange={e => setSellerCountry(e.target.value)}>{SAFE_PAY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.callingCode})</option>)}</select></label>
        <label>Numéro du vendeur<input value={sellerPhone} onChange={e => setSellerPhone(onlyPhoneCharacters(e.target.value))} placeholder="90 00 00 00" inputMode="tel" autoComplete="tel" /></label>
        <label>Description<input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex. Achat d'un téléphone" /></label>
        <label>Montant (XOF)<input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="25000" inputMode="numeric" /></label>
        <label>Délai de livraison <span className="sp-label-optional">(optionnel)</span><input value={deliveryDelay} onChange={e => setDeliveryDelay(e.target.value)} placeholder="Ex. 48 heures" /></label>
        <label>Conditions <span className="sp-label-optional">(optionnel)</span><textarea value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Conditions convenues avec le vendeur" rows={4} /></label>
        {error && <p className="sp-form-error" role="alert">{error}</p>}
        <button className="safepay-primary sp-submit" disabled={busy}>{busy ? "Création…" : "Créer la transaction"}</button>
      </form>
    </section>
  </main>;
}
