"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function ProfileIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9" strokeLinecap="round"/></svg>;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<{ balance: number; locked_balance: number; currency: string } | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { setError("Session expirée. Reconnectez-vous."); return; }
      setUserEmail(user.email ?? "");
      const { data, error: walletError } = await supabase.rpc("get_my_wallet");
      if (walletError) { setError(walletError.message); return; }
      setWallet(data);
    };
    load();
  }, []);

  const money = (value: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

  return <main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
      <strong style={{ fontSize: 21 }}>SafePay</strong>
      <button className="safepay-icon" aria-label="Profil" title="Profil"><ProfileIcon /></button>
    </header>
    <section style={{ paddingTop: 24 }}>
      <div style={{ color: "var(--sp-muted)", fontSize: 13 }}>Compte connecté</div>
      <h1 style={{ margin: "6px 0 18px" }}>Bonjour 👋</h1>
      <div className="safepay-card" style={{ padding: 22 }}>
        <div style={{ color: "var(--sp-muted)", fontSize: 13 }}>Solde disponible</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>{wallet ? money(Number(wallet.balance), wallet.currency || "XOF") : "—"}</div>
        <div style={{ marginTop: 12, color: "var(--sp-muted)" }}>Fonds bloqués : {wallet ? money(Number(wallet.locked_balance), wallet.currency || "XOF") : "—"}</div>
      </div>
      <div className="safepay-card" style={{ padding: 18, marginTop: 14 }}>
        <div style={{ color: "var(--sp-muted)", fontSize: 13 }}>Session</div>
        <div style={{ marginTop: 5 }}>{userEmail}</div>
      </div>
      {error && <p style={{ color: "var(--sp-muted)", fontSize: 13, marginTop: 14 }}>{error}</p>}
    </section>
  </main>;
}
