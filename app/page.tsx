"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [message, setMessage] = useState<string>("");

  async function checkSupabase() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setMessage(data.session ? "Session SafePay active." : "Supabase connecté. Aucune session active.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de connexion Supabase.");
    }
  }

  return (
    <main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <strong style={{ fontSize: 21 }}>SafePay</strong>
        <button className="safepay-icon" aria-label="Profil" title="Profil">
          <span aria-hidden="true">👤</span>
        </button>
      </header>

      <section style={{ paddingTop: 48 }}>
        <div className="safepay-card" style={{ padding: 22 }}>
          <div style={{ color: "var(--sp-muted)", fontSize: 13 }}>SafePay V5</div>
          <h1 style={{ margin: "8px 0", fontSize: 30 }}>Migration Next.js</h1>
          <p style={{ color: "var(--sp-muted)", lineHeight: 1.5 }}>
            Le socle Next.js + TypeScript est maintenant en place. Le frontend V5 sera migré progressivement sans reconstruire le backend Supabase.
          </p>
          <button className="safepay-primary" onClick={checkSupabase}>
            Vérifier Supabase
          </button>
          {message && <p style={{ marginTop: 14, fontSize: 13 }}>{message}</p>}
        </div>
      </section>
    </main>
  );
}
