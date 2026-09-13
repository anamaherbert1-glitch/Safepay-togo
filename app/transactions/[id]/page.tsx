"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: string;
  account_id: string;
  seller_id: string | null;
  seller_phone: string;
  seller_country: string | null;
  description: string;
  amount: number | string;
  commission: number | string;
  currency: string;
  status: string;
  delivery_delay: string | null;
  conditions: string | null;
  created_at: string;
  updated_at: string;
  buyer_total: number | string | null;
  escrow_amount: number | string | null;
  seller_net: number | string | null;
  provider_code: string | null;
  payment_method: string | null;
  payment_source?: string | null;
  recipient_operator?: string | null;
  buyer_operator?: string | null;
  funding_status?: string | null;
  corridor_country?: string | null;
};

type History = {
  id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: string;
};

type Snapshot = {
  gross_amount: number | string;
  provider_collection_fee: number | string;
  safepay_fee: number | string;
  payout_fee: number | string;
  total_customer_fee: number | string;
  buyer_total: number | string;
  escrow_amount: number | string;
  seller_gross: number | string;
  seller_net: number | string;
  fee_payer: string;
  provider_code: string | null;
  payment_method: string | null;
  currency: string;
};

const labels: Record<string, string> = {
  pending: "En attente",
  funded: "Fonds sécurisés",
  delivered: "Livrée",
  completed: "Terminée",
  disputed: "Litige",
  cancelled: "Annulée",
};

const money = (v: number | string, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: (currency || "XOF").trim(),
    maximumFractionDigits: 0,
  }).format(Number(v));

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isBuyer, setIsBuyer] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [reason, setReason] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function load() {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }
    setUserId(user.id);

    const { data, error: e } = await s
      .from("transactions")
      .select(
        "id,account_id,seller_id,seller_phone,seller_country,description,amount,commission,currency,status,delivery_delay,conditions,created_at,updated_at,buyer_total,escrow_amount,seller_net,provider_code,payment_method,payment_source,recipient_operator,buyer_operator,funding_status,corridor_country"
      )
      .eq("id", params.id)
      .maybeSingle();

    if (e || !data) {
      setError(e?.message || "Transaction introuvable.");
      return;
    }

    const row = data as Transaction;
    setTx(row);

    const { data: acc } = await s.from("accounts").select("user_id").eq("id", row.account_id).maybeSingle();
    setIsBuyer(acc?.user_id === user.id);
    setIsSeller(row.seller_id === user.id);

    const { data: snap } = await s
      .from("transaction_fee_snapshots")
      .select(
        "gross_amount,provider_collection_fee,safepay_fee,payout_fee,total_customer_fee,buyer_total,escrow_amount,seller_gross,seller_net,fee_payer,provider_code,payment_method,currency"
      )
      .eq("transaction_id", params.id)
      .order("configuration_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (snap) setSnapshot(snap as Snapshot);

    const { data: hist } = await s
      .from("transaction_status_history")
      .select("id,from_status,to_status,reason,created_at")
      .eq("transaction_id", params.id)
      .order("created_at", { ascending: true });
    setHistory((hist as History[]) || []);
  }

  useEffect(() => {
    load();
    const fundErr = searchParams.get("error");
    if (fundErr) setError(decodeURIComponent(fundErr));
    const fund = searchParams.get("fund");
    if (fund === "direct") {
      setInfo(
        "Paiement Mobile Money en cours. Dès confirmation du prestataire, les fonds seront bloqués automatiquement."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function transition(to: string, reasonText: string) {
    setBusy(true);
    setError("");
    try {
      const s = createClient();
      const { error: e } = await s.functions.invoke("transaction-action", {
        body: { transaction_id: params.id, action: to, reason: reasonText },
      });
      if (e) throw e;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function fundFromWallet() {
    setBusy(true);
    setError("");
    try {
      const s = createClient();
      const { error: e } = await s.rpc("fund_transaction_from_wallet", {
        p_transaction_id: params.id,
      });
      if (e) throw e;
      setInfo("Fonds sécurisés depuis votre wallet Cyenoo.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Financement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function openDispute() {
    if (!reason.trim()) {
      setError("Indiquez le motif du litige.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const s = createClient();
      const { error: e } = await s.functions.invoke("transaction-action", {
        body: { transaction_id: params.id, action: "open_dispute", reason: reason.trim() },
      });
      if (e) throw e;
      setDisputeOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Litige impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!tx) {
    return (
      <main className="sp-page">
        <p className="sp-muted">{error || "Chargement…"}</p>
      </main>
    );
  }

  const currency = tx.currency || "XOF";
  const paymentLabel =
    tx.payment_source === "direct_mm"
      ? "Paiement direct Mobile Money"
      : tx.payment_source === "wallet"
        ? "Paiement par wallet"
        : "—";

  return (
    <main className="sp-page">
      <div className="sp-page-head">
        <button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button>
        <div>
          <p className="sp-eyebrow">Cyenoo · Transaction</p>
          <h1 className="sp-title">{labels[tx.status] ?? tx.status}</h1>
          <p className="sp-muted" style={{ fontSize: 12 }}>{tx.id.slice(0, 8)}…</p>
        </div>
      </div>

      <section className="sp-section-card">
        <h2>Résumé</h2>
        <div className="sp-detail-grid">
          <div><span>Montant</span><strong>{money(tx.amount, currency)}</strong></div>
          <div><span>Total acheteur</span><strong>{money(tx.buyer_total ?? tx.amount, currency)}</strong></div>
          <div><span>Escrow</span><strong>{money(tx.escrow_amount ?? tx.amount, currency)}</strong></div>
          <div><span>Destinataire recevra</span><strong>{money(tx.seller_net ?? tx.amount, currency)}</strong></div>
        </div>
        <p style={{ marginTop: 12 }}><b>Description :</b> {tx.description}</p>
        <p>
          <b>Destinataire :</b> {tx.seller_phone}
          {tx.recipient_operator ? ` · ${tx.recipient_operator}` : ""}
          {tx.corridor_country ? ` · ${tx.corridor_country}` : tx.seller_country ? ` · ${tx.seller_country}` : ""}
        </p>
        <p>
          <b>Mode :</b> {paymentLabel}
          {tx.buyer_operator ? ` (${tx.buyer_operator})` : ""}
        </p>
        {tx.funding_status && (
          <p><b>Financement :</b> {tx.funding_status}</p>
        )}
      </section>

      {snapshot && (
        <section className="sp-section-card" style={{ marginTop: 12 }}>
          <h2>Frais</h2>
          <div className="sp-detail-grid">
            <div><span>Protection Cyenoo</span><strong>{money(snapshot.safepay_fee, currency)}</strong></div>
            <div><span>Frais prestataire</span><strong>{money(snapshot.provider_collection_fee, currency)}</strong></div>
          </div>
        </section>
      )}

      {(tx.delivery_delay || tx.conditions) && (
        <section className="sp-section-card" style={{ marginTop: 12 }}>
          <h2>Détails convenus</h2>
          {tx.delivery_delay && <p><b>Délai :</b> {tx.delivery_delay}</p>}
          {tx.conditions && <p><b>Conditions :</b> {tx.conditions}</p>}
        </section>
      )}

      <section className="sp-section-card" style={{ marginTop: 12 }}>
        <h2>Actions</h2>
        <div className="sp-action-stack">
          {tx.status === "pending" && isBuyer && tx.payment_source === "wallet" && (
            <button className="safepay-primary cyenoo-primary" disabled={busy} onClick={fundFromWallet}>
              Sécuriser les fonds (wallet)
            </button>
          )}
          {tx.status === "pending" && isBuyer && tx.payment_source === "direct_mm" && (
            <p className="sp-muted">
              En attente de confirmation du paiement Mobile Money par le prestataire.
            </p>
          )}
          {tx.status === "pending" && isBuyer && !tx.payment_source && (
            <button
              className="safepay-primary cyenoo-primary"
              disabled={busy}
              onClick={() => transition("funded", "Buyer confirmed Cyenoo escrow")}
            >
              Sécuriser les fonds
            </button>
          )}
          {tx.status === "pending" && isBuyer && (
            <button
              className="sp-secondary-button"
              disabled={busy}
              onClick={() => transition("cancelled", "Buyer cancelled transaction")}
            >
              Annuler
            </button>
          )}
          {tx.status === "funded" && isSeller && (
            <button
              className="safepay-primary cyenoo-primary"
              disabled={busy}
              onClick={() => transition("delivered", "Seller marked transaction delivered")}
            >
              Confirmer la livraison
            </button>
          )}
          {tx.status === "delivered" && isBuyer && (
            <button
              className="safepay-primary cyenoo-primary"
              disabled={busy}
              onClick={() => transition("completed", "Buyer confirmed delivery")}
            >
              Confirmer et libérer les fonds
            </button>
          )}
          {(tx.status === "funded" || tx.status === "delivered") && (isBuyer || isSeller) && (
            <button className="sp-secondary-button" disabled={busy} onClick={() => setDisputeOpen(true)}>
              Ouvrir un litige
            </button>
          )}
          {tx.status === "completed" && (
            <p className="sp-success-note">Les fonds ont été libérés par Cyenoo.</p>
          )}
          {tx.status === "cancelled" && <p className="sp-muted">Cette transaction est annulée.</p>}
          {tx.status === "disputed" && (
            <p className="sp-muted">Dossier en litige — résolution via le support / admin.</p>
          )}
        </div>
      </section>

      {disputeOpen && (
        <section className="sp-section-card" style={{ marginTop: 12 }}>
          <h2>Ouvrir un litige</h2>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Expliquez clairement le problème…" />
          <div className="sp-inline-actions">
            <button className="sp-secondary-button" onClick={() => setDisputeOpen(false)}>Retour</button>
            <button className="safepay-primary cyenoo-primary" disabled={busy} onClick={openDispute}>Confirmer le litige</button>
          </div>
        </section>
      )}

      <section className="sp-section-card" style={{ marginTop: 12 }}>
        <h2>Historique</h2>
        <div className="sp-history">
          {history.map((event) => (
            <div key={event.id} className="sp-history-row">
              <span className="sp-history-dot" />
              <span>
                <strong>{labels[event.to_status] ?? event.to_status}</strong>
                <small>{event.reason ?? "Changement d'état"}</small>
                <small>{new Date(event.created_at).toLocaleString("fr-FR")}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      {info && <p className="sp-muted" style={{ marginTop: 12 }}>{info}</p>}
      {error && <p className="sp-form-error" role="alert">{error}</p>}
    </main>
  );
}
