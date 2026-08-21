"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ProfileIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9" strokeLinecap="round"/></svg>; }
function WalletIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 7.5h14a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3h10" strokeLinecap="round"/><path d="M17 13h3.5v3H17a1.5 1.5 0 1 1 0-3Z"/></svg>; }
function PlusIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8" strokeLinecap="round"/></svg>; }
function ArrowUpIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M7 10l5-5 5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ArrowDownIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M7 14l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function MoreIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>; }

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<{ balance: number; locked_balance: number; currency: string } | null>(null);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { const load = async () => { const supabase = createClient(); const { data: { user }, error: userError } = await supabase.auth.getUser(); if (userError || !user) { setError("Session expirée. Reconnectez-vous."); return; } const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""; setUserName(metadataName || user.email?.split("@")[0] || ""); const { data, error: walletError } = await supabase.rpc("get_my_wallet"); if (walletError) { setError(walletError.message); return; } setWallet(data); }; load(); }, []);
  const money = (value: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const currency = wallet?.currency || "XOF";
  return <main className="safepay-shell safepay-dashboard">
    <header className="sp-header"><div className="sp-brand"><span className="sp-brand-mark">S</span><strong>SafePay</strong></div><button className="safepay-icon" aria-label="Profil" title="Profil" onClick={() => router.push("/profile")}><ProfileIcon /></button></header>
    <section className="sp-content"><p className="sp-eyebrow">Bonjour{userName ? `, ${userName}` : ""} 👋</p><h1 className="sp-title">Votre argent, simplement.</h1>
      <section className="sp-balance-card" aria-label="Solde du portefeuille"><div className="sp-balance-glow"/><div className="sp-balance-top"><span>Solde total</span><button className="sp-eye" aria-label="Afficher le solde">◉</button></div><div className="sp-total">{wallet ? money(Number(wallet.balance) + Number(wallet.locked_balance), currency) : "—"}</div><div className="sp-balance-meta"><div><span>Solde disponible</span><strong>{wallet ? money(Number(wallet.balance), currency) : "—"}</strong></div><div><span>Fonds bloqués</span><strong>{wallet ? money(Number(wallet.locked_balance), currency) : "—"}</strong></div></div></section>
      <section className="sp-quick-actions" aria-label="Actions rapides"><button className="sp-action" onClick={() => router.push("/wallet")}><span className="sp-action-icon blue"><PlusIcon/></span><span>Recharger</span></button><button className="sp-action" onClick={() => router.push("/transactions")}><span className="sp-action-icon green"><ArrowUpIcon/></span><span>Envoyer</span></button><button className="sp-action" onClick={() => router.push("/transactions")}><span className="sp-action-icon violet"><ArrowDownIcon/></span><span>Recevoir</span></button><button className="sp-action" onClick={() => router.push("/services")}><span className="sp-action-icon orange"><MoreIcon/></span><span>Plus</span></button></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Transactions récentes</h2><button onClick={() => router.push("/transactions")}>Voir tout</button></div><div className="sp-empty-state"><div className="sp-empty-icon"><WalletIcon/></div><strong>Vos opérations apparaîtront ici</strong><span>Les transactions seront chargées directement depuis Supabase.</span></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Services rapides</h2><button onClick={() => router.push("/services")}>Voir tout</button></div><div className="sp-services"><button onClick={() => router.push("/wallet")}><span className="service-icon orange"><WalletIcon/></span><span>Mobile Money</span></button><button onClick={() => router.push("/services")}><span className="service-icon violet"><MoreIcon/></span><span>Paiements</span></button><button onClick={() => router.push("/transactions")}><span className="service-icon green"><ArrowUpIcon/></span><span>Transfert</span></button><button onClick={() => router.push("/services")}><span className="service-icon blue"><MoreIcon/></span><span>Plus</span></button></div></section>
      {error && <p className="sp-error">{error}</p>}
    </section>
    <nav className="sp-bottom-nav" aria-label="Navigation principale"><button className="active"><span>⌂</span><small>Accueil</small></button><button onClick={() => router.push("/transactions")}><span>↕</span><small>Transactions</small></button><button onClick={() => router.push("/notifications")}><span>♧</span><small>Notifications</small></button><button onClick={() => router.push("/profile")}><span><ProfileIcon/></span><small>Profil</small></button></nav>
  </main>;
}
