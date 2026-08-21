"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  commission: number | string;
  currency: string;
  status: string;
  seller_phone: string;
  created_at: string;
};

const labels: Record<string, string> = {
  pending: "En attente",
  funded: "Sécurisée",
  delivered: "Livrée",
  completed: "Terminée",
  disputed: "Litige",
  cancelled: "Annulée",
};

function statusClass(status: string) {
  return `sp-status sp-status-${status}`;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) { setError("Session expirée. Reconnectez-vous."); setLoading(false); } return; }
      const { data, error: queryError } = await supabase
        .from("transactions")
        .select("id,description,amount,commission,currency,status,seller_phone,created_at")
        .order("created_at", { ascending: false });
      if (active) {
        if (queryError) setError(queryError.message);
        else setTransactions((data ?? []) as Transaction[]);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const money = (value: number | string, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));

  return (
    <AppShell>
      <section className="sp-page">
        <div className="sp-page-head"><div><p className="sp-eyebrow">SafePay</p><h1 className="sp-title">Transactions</h1></div><button className="safepay-primary sp-small-button" onClick={() => router.push("/transactions/new")}>+ Nouvelle</button></div>
        {loading && <section className="sp-section-card"><p className="sp-muted">Chargement de vos transactions…</p></section>}
        {error && <section className="sp-section-card"><p className="sp-form-error">{error}</p></section>}
        {!loading && !error && transactions.length === 0 && <section className="sp-section-card sp-empty-list"><div className="sp-empty-icon">↕</div><strong>Aucune transaction</strong><span>Vos opérations SafePay apparaîtront ici.</span><button className="safepay-primary" onClick={() => router.push("/transactions/new")}>Créer une transaction</button></section>}
        {!loading && !error && transactions.length > 0 && <section className="sp-transaction-list">{transactions.map((tx) => <button className="sp-transaction-row" key={tx.id} onClick={() => router.push(`/transactions/${tx.id}`)}><span className="sp-tx-icon">↕</span><span className="sp-tx-main"><strong>{tx.description}</strong><small>Vendeur : {tx.seller_phone}</small><small>{new Date(tx.created_at).toLocaleString("fr-FR")}</small></span><span className="sp-tx-side"><strong>{money(tx.amount, tx.currency)}</strong><small className={statusClass(tx.status)}>{labels[tx.status] ?? tx.status}</small></span></button>)}</section>}
      </section>
    </AppShell>
  );
}
