"use client";

import { useCallback, useEffect, useState } from "react";

type TestUser = { id: string; display_name: string; phone: string; role: string; country: string };
type TestTx = { id: string; reference: string; description: string; amount: number; currency: string; status: string; payment_method: string; buyer_id: string; seller_id: string };
type TestPayment = { id: string; transaction_id: string; provider: string; amount: number; status: string; provider_reference: string };
type TestEvent = { id: string; transaction_id: string; event_type: string; details: Record<string, unknown>; created_at: string };
type Snapshot = { users: TestUser[]; transactions: TestTx[]; payments: TestPayment[]; events: TestEvent[]; simulated: boolean };

const ACCESS_CODE = "CYENOO-TEST-2026";
const apiUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "") + "/functions/v1/cyenoo-test-api";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const statuses: Record<string, string> = { pending: "En attente", funded: "Paiement sécurisé", delivered: "Livrée", completed: "Terminée", disputed: "Litige", cancelled: "Annulée" };

export default function TestModePage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState(ACCESS_CODE);

  const callApi = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, "x-test-code": code }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erreur du serveur de test.");
    return result;
  }, [code]);

  const refresh = useCallback(async () => {
    setBusy(true); setMessage("");
    try { setData(await callApi({ action: "list" })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Impossible de charger les données."); }
    finally { setBusy(false); }
  }, [callApi]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function action(payload: Record<string, unknown>, success: string) {
    setBusy(true); setMessage("");
    try { await callApi(payload); setMessage(success); setData(await callApi({ action: "list" })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Action impossible."); }
    finally { setBusy(false); }
  }

  const money = (amount: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount));
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 };
  const button: React.CSSProperties = { border: 0, borderRadius: 10, padding: "10px 12px", background: "#087f5b", color: "#fff", fontWeight: 700, cursor: "pointer", margin: "4px 4px 4px 0" };

  return <main style={{ minHeight: "100vh", background: "#f4f7f6", color: "#17211e", padding: "22px 14px 48px", fontFamily: "Arial, sans-serif" }}>
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div><div style={{ fontSize: 12, fontWeight: 800, color: "#087f5b", letterSpacing: 2 }}>CYENOO · ENVIRONNEMENT ISOLÉ</div><h1 style={{ fontSize: 28, margin: "7px 0" }}>Mode test</h1><p style={{ color: "#64716c", margin: 0 }}>Données fictives · aucun SMS ni paiement réel</p></div>
        <a href="/login" style={{ color: "#087f5b", fontWeight: 700 }}>Retour à la connexion</a>
      </header>
      <section style={{ ...card, background: "#e8f7f0", borderColor: "#b8e5d1", marginBottom: 14 }}>
        <strong>Mode simulation actif</strong><p style={{ margin: "6px 0 0", color: "#36584a", fontSize: 14 }}>Toutes les actions ci-dessous écrivent uniquement dans le schéma privé cyenoo_test. eSMS Africa reste désactivé. Code d’accès de démonstration : <b>{ACCESS_CODE}</b>.</p>
      </section>
      <section style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ fontSize: 18, margin: 0 }}>Comptes fictifs</h2><button style={button} disabled={busy} onClick={() => void refresh()}>Actualiser</button></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 12 }}>
          {(data?.users || []).map(user => <div key={user.id} style={{ background: "#f7faf8", borderRadius: 12, padding: 12 }}><b>{user.display_name}</b><div style={{ color: "#65736d", fontSize: 13, marginTop: 5 }}>{user.role} · {user.country}</div><div style={{ fontSize: 13 }}>{user.phone}</div></div>)}
        </div>
      </section>
      <section style={{ ...card, marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Transactions simulées</h2>
        {(data?.transactions || []).map(tx => <article key={tx.id} style={{ borderTop: "1px solid #edf0ee", padding: "13px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><b>{tx.description}</b><div style={{ color: "#64716c", fontSize: 12, marginTop: 4 }}>{tx.reference} · {tx.payment_method}</div></div><div style={{ textAlign: "right" }}><b>{money(tx.amount, tx.currency)}</b><div style={{ color: "#087f5b", fontSize: 12, marginTop: 4 }}>{statuses[tx.status] || tx.status}</div></div></div>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap" }}>
            <button style={button} disabled={busy} onClick={() => void action({ action: "simulate_payment", transaction_id: tx.id, outcome: "success", provider: "T-Money (simulation)" }, "Paiement fictif réussi.")}>Simuler paiement réussi</button>
            <button style={{ ...button, background: "#a33b3b" }} disabled={busy} onClick={() => void action({ action: "simulate_payment", transaction_id: tx.id, outcome: "failure", provider: "Flooz (simulation)" }, "Échec de paiement simulé.")}>Simuler échec</button>
            <button style={{ ...button, background: "#52645c" }} disabled={busy} onClick={() => void action({ action: "set_status", transaction_id: tx.id, status: "delivered" }, "Commande marquée livrée (simulation).")}>Marquer livrée</button>
            <button style={{ ...button, background: "#52645c" }} disabled={busy} onClick={() => void action({ action: "set_status", transaction_id: tx.id, status: "completed" }, "Commande terminée (simulation).")}>Valider réception</button>
            <button style={{ ...button, background: "#a36a20" }} disabled={busy} onClick={() => void action({ action: "set_status", transaction_id: tx.id, status: "disputed" }, "Litige simulé.")}>Ouvrir litige</button>
          </div>
        </article>)}
        {!data?.transactions?.length && <p style={{ color: "#64716c" }}>Aucune transaction disponible.</p>}
      </section>
      <section style={card}>
        <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Derniers événements de test</h2>
        {(data?.events || []).slice(0, 12).map(event => <div key={event.id} style={{ borderTop: "1px solid #edf0ee", padding: "9px 0", fontSize: 13 }}><b>{event.event_type}</b><span style={{ color: "#64716c" }}> · {new Date(event.created_at).toLocaleString("fr-FR")}</span></div>)}
        {!data?.events?.length && <p style={{ color: "#64716c" }}>Aucun événement enregistré.</p>}
      </section>
      {message && <p role="status" style={{ padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #dce5df", marginTop: 14 }}>{message}</p>}
      {busy && <p style={{ color: "#64716c", fontSize: 13 }}>Traitement en cours…</p>}
      <p style={{ color: "#84908b", fontSize: 12, marginTop: 18 }}>Démonstration temporaire — les comptes de cette page ne sont pas des comptes d’authentification de production.</p>
    </div>
  </main>;
}
