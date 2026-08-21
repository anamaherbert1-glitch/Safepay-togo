"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Wallet = { id: string; balance: number; locked_balance: number; currency: string };
type LedgerEntry = { id: string; entry_type: string; amount: number | string; balance_before: number | string; balance_after: number | string; locked_before: number | string; locked_after: number | string; description: string | null; created_at: string };

const entryLabels: Record<string,string> = { lock: "Fonds sécurisés", release: "Fonds libérés", refund: "Remboursement", credit: "Crédit", debit: "Débit" };

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) { setError("Session expirée. Reconnectez-vous."); setLoading(false); } return; }
      const { data, error: walletError } = await supabase.rpc("get_my_wallet");
      if (walletError) { if (active) { setError(walletError.message); setLoading(false); } return; }
      const currentWallet = data as Wallet;
      if (active) setWallet(currentWallet);
      const { data: entries, error: ledgerError } = await supabase.from("wallet_ledger").select("id,entry_type,amount,balance_before,balance_after,locked_before,locked_after,description,created_at").eq("wallet_id", currentWallet.id).order("created_at", { ascending: false }).limit(50);
      if (active) { if (ledgerError) setError(ledgerError.message); else setLedger((entries ?? []) as LedgerEntry[]); setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  const money = (value: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const currency = wallet?.currency || "XOF";

  return <main className="safepay-shell safepay-dashboard">
    <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Mon Wallet</strong><span style={{ width: 36 }} /></header>
    <section className="sp-content">
      <section className="sp-balance-card"><div className="sp-balance-top"><span>Solde disponible</span></div><div className="sp-total">{wallet ? money(Number(wallet.balance), currency) : "—"}</div><div className="sp-balance-meta"><div><span>Fonds bloqués</span><strong>{wallet ? money(Number(wallet.locked_balance), currency) : "—"}</strong></div><div><span>Devise</span><strong>{currency}</strong></div></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Historique du portefeuille</h2></div>{loading ? <p className="sp-muted">Chargement…</p> : ledger.length === 0 ? <p className="sp-muted">Aucune opération financière dans le ledger.</p> : <div className="sp-transaction-list">{ledger.map(entry => { const positive = ["credit","refund"].includes(entry.entry_type); return <div className="sp-transaction-row" key={entry.id}><span className="sp-tx-icon">{positive ? "+" : "−"}</span><span className="sp-tx-main"><strong>{entryLabels[entry.entry_type] ?? entry.entry_type}</strong><small>{entry.description ?? "Opération SafePay"}</small><small>{new Date(entry.created_at).toLocaleString("fr-FR")}</small></span><span className="sp-tx-side"><strong>{positive ? "+" : "−"}{money(Number(entry.amount), currency)}</strong><small>Solde : {money(Number(entry.balance_after), currency)}</small></span></div>; })}</div>}</section>
      {error && <p className="sp-error" role="alert">{error}</p>}
    </section>
  </main>;
}
