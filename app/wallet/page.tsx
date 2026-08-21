"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<{ balance: number; locked_balance: number; currency: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Session expirée. Reconnectez-vous."); return; }
      const { data, error: walletError } = await supabase.rpc("get_my_wallet");
      if (walletError) { setError(walletError.message); return; }
      setWallet(data);
    };
    load();
  }, []);

  const money = (value: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const currency = wallet?.currency || "XOF";

  return <main className="safepay-shell safepay-dashboard">
    <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Mon Wallet</strong><span style={{ width: 36 }} /></header>
    <section className="sp-content">
      <section className="sp-balance-card"><div className="sp-balance-top"><span>Solde disponible</span></div><div className="sp-total">{wallet ? money(Number(wallet.balance), currency) : "—"}</div><div className="sp-balance-meta"><div><span>Fonds bloqués</span><strong>{wallet ? money(Number(wallet.locked_balance), currency) : "—"}</strong></div><div><span>Devise</span><strong>{currency}</strong></div></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Votre portefeuille</h2></div><p style={{color:"var(--sp-muted)",fontSize:13,lineHeight:1.5}}>Le solde affiché provient directement de Supabase. Les opérations financières seront ajoutées ici sans utiliser le stockage local comme source de vérité.</p></section>
      {error && <p className="sp-error">{error}</p>}
    </section>
  </main>;
}
