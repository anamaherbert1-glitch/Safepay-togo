"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CYENOO_CORRIDORS,
  CorridorCountry,
  corridorFromCountryCode,
  operatorsForCountry,
} from "@/lib/mm-operators";
import { OperatorBadgeGrid } from "@/components/mm/OperatorBadge";

export default function WithdrawPage() {
  const router = useRouter();
  const [country, setCountry] = useState<CorridorCountry>("TG");
  const [operatorCode, setOperatorCode] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const operators = useMemo(() => operatorsForCountry(country), [country]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = createClient();
        const { data } = await s.rpc("get_my_profile");
        if (!active) return;
        const profile = Array.isArray(data) ? data[0] : data;
        if (profile?.country) setCountry(corridorFromCountryCode(String(profile.country)));
        if (profile?.phone) setPhone(String(profile.phone));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setOperatorCode(operators[0]?.code ?? "");
  }, [country, operators]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount % 5 !== 0) {
      setError("Le montant doit être positif et être un multiple de 5 XOF.");
      return;
    }
    if (!operatorCode) {
      setError("Choisissez un opérateur Mobile Money.");
      return;
    }
    if (!/^\+?[0-9\s]{8,18}$/.test(phone.trim())) {
      setError("Entrez un numéro de téléphone valide avec son indicatif.");
      return;
    }

    const op = operators.find((o) => o.code === operatorCode);
    const providerLabel = op?.label ?? operatorCode;

    setBusy(true);
    try {
      const supabase = createClient();
      const idempotencyKey = crypto.randomUUID();
      const { data, error: invokeError } = await supabase.functions.invoke("cinetpay-withdraw", {
        body: {
          amount: numericAmount,
          currency: "XOF",
          provider: providerLabel,
          operator_code: operatorCode,
          country,
          phone: phone.trim(),
          idempotency_key: idempotencyKey,
        },
      });
      if (invokeError) throw invokeError;
      if (!data?.success) {
        throw new Error(data?.message || data?.error || "Impossible d'initialiser le retrait.");
      }
      router.replace("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'initialiser le retrait.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="safepay-shell cyenoo-shell safepay-dashboard cyenoo-dashboard">
      <header className="sp-header">
        <button className="sp-back" onClick={() => router.back()} aria-label="Retour">
          ←
        </button>
        <strong>Retirer</strong>
        <span style={{ width: 36 }} />
      </header>
      <section className="sp-content">
        <p className="sp-eyebrow">Wallet Cyenoo</p>
        <h1 className="sp-title">Retirer des fonds</h1>
        <p className="sp-muted">
          Les fonds sont réservés avant le payout. En cas d'échec, ils sont restitués automatiquement.
        </p>

        <form className="sp-form" onSubmit={submit}>
          <label>
            Pays
            <select value={country} onChange={(e) => setCountry(e.target.value as CorridorCountry)}>
              {CYENOO_CORRIDORS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Opérateur de retrait</span>
            <OperatorBadgeGrid
              operators={operators}
              value={operatorCode}
              onChange={setOperatorCode}
            />
          </div>

          <label>
            Numéro à créditer
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={
                (CYENOO_CORRIDORS.find((c) => c.code === country)?.dial || "+228") + " …"
              }
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label>
            Montant (XOF)
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="10000"
              inputMode="numeric"
            />
          </label>
          {error && (
            <p className="sp-form-error" role="alert">
              {error}
            </p>
          )}
          <button className="safepay-primary sp-submit" disabled={busy}>
            {busy ? "Traitement…" : "Demander le retrait"}
          </button>
        </form>
      </section>
    </main>
  );
}
