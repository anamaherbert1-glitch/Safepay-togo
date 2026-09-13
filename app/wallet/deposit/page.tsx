"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const providers = [
  { value: "T-Money", label: "T-Money" },
  { value: "Moov Money", label: "Moov Money / Flooz" },
  { value: "Orange Money", label: "Orange Money (Burkina)" },
];

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("T-Money");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount % 5 !== 0) {
      setError("Le montant doit être positif et être un multiple de 5 XOF.");
      return;
    }
    if (!/^\+?[0-9\s]{8,18}$/.test(phone.trim())) {
      setError("Entrez un numéro de téléphone valide avec son indicatif.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const idempotencyKey = crypto.randomUUID();
      const { data, error: invokeError } = await supabase.functions.invoke("cinetpay-deposit", {
        body: {
          amount: numericAmount,
          currency: "XOF",
          provider,
          phone: phone.trim(),
          idempotency_key: idempotencyKey,
          return_url: `${window.location.origin}/wallet`,
        },
      });
      if (invokeError) throw invokeError;
      if (!data?.success) throw new Error(data?.message || data?.error || "Impossible d'initialiser la recharge.");
      if (data.payment_url) {
        window.location.assign(data.payment_url);
        return;
      }
      router.replace("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'initialiser la recharge.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="safepay-shell cyenoo-shell safepay-dashboard">
      <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Recharger</strong><span style={{ width: 36 }} /></header>
      <section className="sp-content">
        <p className="sp-eyebrow">Wallet Cyenoo</p>
        <h1 className="sp-title">Recharger votre Wallet</h1>
        <p className="sp-muted">La recharge est confirmée par Mobile Money (T-Money, Moov, Orange selon le pays).</p>
        <form className="sp-form" onSubmit={submit}>
          <label>Montant (XOF)<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex. 5000" required /></label>
          <label>Mode de paiement<select value={provider} onChange={(e) => setProvider(e.target.value)}>{providers.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
          <label>Numéro Mobile Money<input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+228…" required /></label>
          {error && <p className="sp-form-error" role="alert">{error}</p>}
          <button className="safepay-primary cyenoo-primary" type="submit" disabled={busy}>{busy ? "Traitement…" : "Continuer"}</button>
        </form>
      </section>
    </main>
  );
}
