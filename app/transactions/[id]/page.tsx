"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Transaction = { id: string; account_id: string; seller_id: string | null; seller_phone: string; seller_country: string | null; description: string; amount: number | string; commission: number | string; currency: string; status: string; delivery_delay: string | null; conditions: string | null; created_at: string; updated_at: string; };
type History = { id: string; from_status: string | null; to_status: string; reason: string | null; created_at: string };

const labels: Record<string, string> = { pending: "En attente", funded: "Fonds sécurisés", delivered: "Livrée", completed: "Terminée", disputed: "Litige", cancelled: "Annulée" };

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isBuyer, setIsBuyer] = useState(false);
  const [reason, setReason] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée. Reconnectez-vous."); return; }
    setUserId(user.id);
    const { data, error: txError } = await supabase.from("transactions").select("id,account_id,seller_id,seller_phone,seller_country,description,amount,commission,currency,status,delivery_delay,conditions,created_at,updated_at").eq("id", params.id).single();
    if (txError) { setError(txError.message); return; }
    const transaction = data as Transaction;
    setTx(transaction);
    const { data: buyerAccount } = await supabase.from("accounts").select("id").eq("id", transaction.account_id).eq("user_id", user.id).maybeSingle();
    setIsBuyer(Boolean(buyerAccount));
    const { data: events } = await supabase.from("transaction_status_history").select("id,from_status,to_status,reason,created_at").eq("transaction_id", params.id).order("created_at", { ascending: false });
    setHistory((events ?? []) as History[]);
  }

  useEffect(() => { load(); }, [params.id]);

  async function transition(toStatus: string, actionReason?: string) {
    setError(""); setBusy(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("transition_transaction", { p_transaction_id: params.id, p_to_status: toStatus, p_reason: actionReason || null });
      if (rpcError) throw rpcError;
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Action impossible."); } finally { setBusy(false); }
  }

  async function openDispute() {
    if (!reason.trim()) { setError("Indiquez la raison du litige."); return; }
    setError(""); setBusy(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("open_dispute", { p_transaction_id: params.id, p_reason: "user_dispute", p_description: reason.trim() });
      if (rpcError) throw rpcError;
      setDisputeOpen(false); setReason(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible d'ouvrir le litige."); } finally { setBusy(false); }
  }

  if (error && !tx) return <main className="safepay-shell safepay-dashboard"><header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Transaction</strong></header><section className="sp-content"><p className="sp-form-error">{error}</p></section></main>;
  if (!tx) return <main className="safepay-shell safepay-dashboard"><header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Transaction</strong></header><section className="sp-content"><p className="sp-muted">Chargement…</p></section></main>;

  const isSeller = tx.seller_id === userId;
  const total = Number(tx.amount) + Number(tx.commission);
  const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: tx.currency, maximumFractionDigits: 0 }).format(value);

  return (
    <main className="safepay-shell safepay-dashboard">
      <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Détail transaction</strong><span style={{ width: 36 }} /></header>
      <section className="sp-content">
        <section className="sp-section-card"><div className="sp-detail-status"><span className={`sp-status sp-status-${tx.status}`}>{labels[tx.status] ?? tx.status}</span><span>{new Date(tx.created_at).toLocaleString("fr-FR")}</span></div><h1 className="sp-detail-title">{tx.description}</h1><div className="sp-detail-amount">{money(Number(tx.amount))}</div><div className="sp-detail-grid"><div><span>Commission</span><strong>{money(Number(tx.commission))}</strong></div><div><span>Total bloqué</span><strong>{money(total)}</strong></div><div><span>Vendeur</span><strong>{tx.seller_phone}</strong></div><div><span>Pays</span><strong>{tx.seller_country ?? "—"}</strong></div></div></section>
        {(tx.delivery_delay || tx.conditions) && <section className="sp-section-card"><h2>Détails convenus</h2>{tx.delivery_delay && <p><b>Délai :</b> {tx.delivery_delay}</p>}{tx.conditions && <p><b>Conditions :</b> {tx.conditions}</p>}</section>}
        <section className="sp-section-card"><h2>Actions sécurisées</h2><div className="sp-action-stack">
          {tx.status === "pending" && isBuyer && <button className="safepay-primary" disabled={busy} onClick={() => transition("funded", "Buyer confirmed SafePay escrow")}>Sécuriser les fonds</button>}
          {tx.status === "pending" && isBuyer && <button className="sp-secondary-button" disabled={busy} onClick={() => transition("cancelled", "Buyer cancelled transaction")}>Annuler</button>}
          {tx.status === "funded" && isSeller && <button className="safepay-primary" disabled={busy} onClick={() => transition("delivered", "Seller marked transaction delivered")}>Confirmer la livraison</button>}
          {tx.status === "delivered" && isBuyer && <button className="safepay-primary" disabled={busy} onClick={() => transition("completed", "Buyer confirmed delivery")}>Confirmer et libérer les fonds</button>}
          {(tx.status === "funded" || tx.status === "delivered") && (isBuyer || isSeller) && <button className="sp-secondary-button" disabled={busy} onClick={() => setDisputeOpen(true)}>Ouvrir un litige</button>}
          {tx.status === "completed" && <p className="sp-success-note">Les fonds ont été libérés par le backend SafePay.</p>}
          {tx.status === "cancelled" && <p className="sp-muted">Cette transaction est annulée.</p>}
          {tx.status === "disputed" && <p className="sp-muted">Le dossier est en litige. La résolution doit passer par le système autorisé.</p>}
        </div></section>
        {disputeOpen && <section className="sp-section-card"><h2>Ouvrir un litige</h2><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Expliquez clairement le problème…"/><div className="sp-inline-actions"><button className="sp-secondary-button" onClick={() => setDisputeOpen(false)}>Retour</button><button className="safepay-primary" disabled={busy} onClick={openDispute}>Confirmer le litige</button></div></section>}
        <section className="sp-section-card"><h2>Historique</h2><div className="sp-history">{history.map((event) => <div key={event.id} className="sp-history-row"><span className="sp-history-dot"/><span><strong>{labels[event.to_status] ?? event.to_status}</strong><small>{event.reason ?? "Changement d'état"}</small><small>{new Date(event.created_at).toLocaleString("fr-FR")}</small></span></div>)}</div></section>
        {error && <p className="sp-form-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
