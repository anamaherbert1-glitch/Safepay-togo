"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const checks = [
  ["all_sensitive_tables_rls", "RLS des tables financières et sensibles"],
  ["admin_rpc_anon_locked", "RPC administratives inaccessibles à anon"],
  ["service_role_exposed_to_client", "Service role absente du client"],
];

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setError("Session administrateur requise.");
      setLoading(false);
      return;
    }
    const { data: admin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || admin !== true) {
      setError("Accès administrateur requis.");
      setLoading(false);
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("admin_security_status");
    if (rpcError) setError(rpcError.message);
    else setStatus(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "#071321", color: "#eef6ff", fontFamily: "Inter,system-ui" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>Sécurité du Dashboard</h1>
            <p style={{ opacity: .65 }}>Contrôles vérifiés depuis SafePay, pas des indicateurs statiques.</p>
          </div>
          <button onClick={load} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #2b6cb0", background: "#1677ff", color: "white", cursor: "pointer" }}>Actualiser</button>
        </div>

        {loading && <p>Vérification en cours…</p>}
        {error && <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,80,100,.12)", color: "#ffabb5" }}>{error}</div>}

        {status && <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 22 }}>
            {checks.map(([key, label]) => {
              const value = key === "service_role_exposed_to_client" ? status[key] === false : status[key] === true;
              return <article key={key} style={{ padding: 16, borderRadius: 14, border: "1px solid rgba(148,163,184,.16)", background: "rgba(255,255,255,.03)" }}>
                <div style={{ fontSize: 25 }}>{value ? "✅" : "⚠️"}</div>
                <strong>{label}</strong>
                <div style={{ opacity: .55, marginTop: 6, fontSize: 12 }}>{value ? "Vérifié" : "À corriger"}</div>
              </article>;
            })}
          </section>

          <section style={{ marginTop: 14, padding: 16, borderRadius: 14, border: "1px solid rgba(148,163,184,.16)" }}>
            <h2 style={{ fontSize: 16 }}>Surface RPC</h2>
            <p>SECURITY DEFINER admin : <b>{status.admin_rpc_security_definer_count}</b></p>
            <p>Exécutables par anon : <b>{status.admin_rpc_anon_execute_count}</b></p>
            <p>Exécutables par authenticated : <b>{status.admin_rpc_authenticated_execute_count}</b> (les fonctions doivent ensuite contrôler <code>is_admin()</code>).</p>
          </section>

          <section style={{ marginTop: 14, padding: 16, borderRadius: 14, border: "1px solid rgba(148,163,184,.16)" }}>
            <h2 style={{ fontSize: 16 }}>Tables sensibles — RLS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
              {Object.entries(status.sensitive_tables_rls || {}).map(([table, enabled]) => <div key={table} style={{ padding: 10, borderRadius: 9, background: "rgba(255,255,255,.04)" }}>{enabled ? "✅" : "❌"} {table}</div>)}
            </div>
          </section>

          <p style={{ marginTop: 18, opacity: .55, fontSize: 12 }}>{status.note}</p>
        </>}
      </div>
    </main>
  );
}
