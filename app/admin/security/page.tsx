"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const checks = [
  ["all_sensitive_tables_rls", "RLS des tables financières et sensibles"],
  ["admin_rpc_anon_locked", "RPC administratives inaccessibles à anon"],
  ["service_role_exposed_to_client", "Service role absente du client"],
] as const;

const shell: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at 80% -10%, rgba(22,131,255,.18), transparent 32%), linear-gradient(145deg,#050c17,#071525 55%,#06101d)", color: "#f5f9ff", fontFamily: "Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif", padding: "28px 22px 54px" };
const panel: React.CSSProperties = { background: "linear-gradient(145deg,rgba(11,25,43,.94),rgba(7,17,30,.9))", border: "1px solid rgba(102,180,255,.14)", borderRadius: 20, boxShadow: "0 18px 55px rgba(0,0,0,.2)", padding: 22 };

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setError("Session administrateur requise."); setLoading(false); return; }
    const { data: admin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || admin !== true) { setError("Accès administrateur requis."); setLoading(false); return; }
    const { data, error: rpcError } = await supabase.rpc("admin_security_status");
    if (rpcError) setError(rpcError.message); else setStatus(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={shell}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <a href="/admin" style={{ color: "#7fc0ff", textDecoration: "none", fontSize: 13 }}>← Retour au Dashboard</a>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, flexWrap: "wrap", margin: "22px 0 20px" }}>
          <div>
            <div style={{ color: "#59a9ff", fontSize: 10, fontWeight: 900, letterSpacing: ".18em" }}>CONFIGURATION • SÉCURITÉ</div>
            <h1 style={{ margin: "7px 0", fontSize: 36, letterSpacing: "-.035em" }}>Sécurité du Dashboard</h1>
            <p style={{ margin: 0, color: "#8ca2bb", maxWidth: 720 }}>Contrôles vérifiés depuis SafePay. Les résultats proviennent du backend, pas de simples indicateurs visuels.</p>
          </div>
          <button onClick={load} disabled={loading} style={{ border: "1px solid rgba(102,180,255,.2)", borderRadius: 11, padding: "11px 15px", background: "linear-gradient(135deg,#2d99ff,#075ed8)", color: "#fff", fontWeight: 800, cursor: loading ? "wait" : "pointer", opacity: loading ? .65 : 1 }}>{loading ? "Vérification…" : "Actualiser"}</button>
        </header>

        {error && <div style={{ ...panel, background: "rgba(255,80,100,.08)", borderColor: "rgba(255,102,120,.25)", color: "#ffabb5", marginBottom: 16 }}>⚠️ {error}</div>}
        {loading && !error && <div style={{ ...panel, color: "#8ca2bb" }}>Analyse des contrôles de sécurité en cours…</div>}

        {status && <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 16 }}>
            {checks.map(([key, label]) => {
              const value = key === "service_role_exposed_to_client" ? status[key] === false : status[key] === true;
              return <article key={key} style={{ ...panel, padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: "0 auto 0 0", width: 3, background: value ? "#39d98a" : "#ff6678" }} />
                <div style={{ fontSize: 24, marginBottom: 12 }}>{value ? "✓" : "!"}</div>
                <strong style={{ display: "block", lineHeight: 1.35 }}>{label}</strong>
                <span style={{ display: "inline-block", marginTop: 10, padding: "5px 9px", borderRadius: 999, background: value ? "rgba(57,217,138,.08)" : "rgba(255,102,120,.08)", color: value ? "#8bd8b2" : "#ffabb5", fontSize: 11, fontWeight: 800 }}>{value ? "VÉRIFIÉ" : "À CORRIGER"}</span>
              </article>;
            })}
          </section>

          <section style={{ ...panel, marginBottom: 14 }}>
            <div style={{ color: "#59a9ff", fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>RPC</div>
            <h2 style={{ margin: "6px 0 16px", fontSize: 20 }}>Surface des fonctions administratives</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
              {[['SECURITY DEFINER admin', status.admin_rpc_security_definer_count], ['Exécutables par anon', status.admin_rpc_anon_execute_count], ['Exécutables par authenticated', status.admin_rpc_authenticated_execute_count]].map(([label, value]) => <div key={String(label)} style={{ padding: 16, borderRadius: 14, background: "rgba(7,21,37,.75)", border: "1px solid rgba(102,180,255,.10)" }}><div style={{ color: "#8ca2bb", fontSize: 12 }}>{label}</div><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{String(value ?? 0)}</strong></div>)}
            </div>
            <p style={{ margin: "14px 0 0", color: "#7189a5", fontSize: 12 }}>Les fonctions accessibles aux utilisateurs authentifiés doivent continuer à contrôler le rôle administrateur côté backend.</p>
          </section>

          <section style={panel}>
            <div style={{ color: "#59a9ff", fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>DONNÉES SENSIBLES</div>
            <h2 style={{ margin: "6px 0 16px", fontSize: 20 }}>Tables sensibles — RLS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
              {Object.entries(status.sensitive_tables_rls || {}).map(([table, enabled]) => <div key={table} style={{ padding: "11px 13px", borderRadius: 11, background: enabled ? "rgba(57,217,138,.055)" : "rgba(255,102,120,.07)", border: `1px solid ${enabled ? "rgba(57,217,138,.12)" : "rgba(255,102,120,.2)"}`, color: enabled ? "#b9e9d0" : "#ffabb5", fontSize: 12 }}>{enabled ? "✓" : "!"} {table}</div>)}
            </div>
            {status.note && <p style={{ margin: "16px 0 0", color: "#7189a5", fontSize: 12 }}>{status.note}</p>}
          </section>
        </>}
      </div>
      <style>{`@media(max-width:800px){.security-grid{grid-template-columns:1fr!important}}@media(max-width:600px){main{padding:18px 12px 36px!important}h1{font-size:28px!important}}`}</style>
    </main>
  );
}
