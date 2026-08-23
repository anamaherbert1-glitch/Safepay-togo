"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const money = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v || 0);
const fmt = (v: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${v}T00:00:00`));

type Point = { date: string; transaction_volume?: number; revenue?: number; deposits?: number; withdrawals?: number; new_users?: number };

export default function AdminAnalytics() {
  const [points, setPoints] = useState<Point[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [metric, setMetric] = useState<"transaction_volume" | "revenue" | "deposits" | "withdrawals" | "new_users">("transaction_volume");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const end = to ? new Date(`${to}T23:59:59`) : new Date();
    const start = from ? new Date(`${from}T00:00:00`) : new Date(end.getTime() - 29 * 86400000);
    const days = Math.max(1, Math.min(365, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1));
    const s = createClient();
    const gate = await s.rpc("is_admin");
    if (gate.error || !gate.data) { setError("Accès administrateur requis."); setLoading(false); return; }
    const r = await s.rpc("admin_analytics_timeseries", { p_days: days });
    if (r.error) setError(r.error.message); else {
      const data = Array.isArray(r.data) ? r.data : [];
      const first = from || new Date(end.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10);
      setPoints(data.filter((p: Point) => p.date >= first && p.date <= end.toISOString().slice(0, 10)));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => points.reduce((a, p) => ({ volume: a.volume + Number(p.transaction_volume || 0), revenue: a.revenue + Number(p.revenue || 0), deposits: a.deposits + Number(p.deposits || 0), withdrawals: a.withdrawals + Number(p.withdrawals || 0), users: a.users + Number(p.new_users || 0) }), { volume: 0, revenue: 0, deposits: 0, withdrawals: 0, users: 0 }), [points]);
  const max = Math.max(1, ...points.map(p => Number(p[metric] || 0)));
  const title = metric === "transaction_volume" ? "Volume transactionnel" : metric === "revenue" ? "Revenus plateforme" : metric === "deposits" ? "Dépôts" : metric === "withdrawals" ? "Retraits" : "Nouveaux utilisateurs";

  return <main style={{ minHeight: "100vh", background: "#050b16", color: "#f1f6ff", padding: 28, fontFamily: "Inter,system-ui,sans-serif" }}>
    <div style={{ maxWidth: 1500, margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#72b4ff", textDecoration: "none", fontSize: 13 }}>← Dashboard Admin</a>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginTop: 22, flexWrap: "wrap" }}>
        <div><div style={{ color: "#6295cc", fontSize: 11, fontWeight: 800, letterSpacing: ".16em" }}>ANALYTICS SAFEPAY</div><h1 style={{ fontSize: 34, margin: "8px 0" }}>Trafic & revenus</h1><p style={{ color: "#8094aa", margin: 0 }}>Données calculées par le backend SafePay, sans chiffres simulés.</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><label style={label}>Du<input style={input} type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label style={label}>Au<input style={input} type="date" value={to} onChange={e => setTo(e.target.value)} /></label><button onClick={load} style={button}>Appliquer</button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12, margin: "24px 0" }}>
        {[["Volume",money(totals.volume)],["Revenus",money(totals.revenue)],["Dépôts",money(totals.deposits)],["Retraits",money(totals.withdrawals)],["Nouveaux utilisateurs",totals.users.toLocaleString("fr-FR")]].map(([k,v]) => <div key={k} style={card}><small style={{ color: "#7890a9" }}>{k}</small><strong style={{ display: "block", fontSize: 23, marginTop: 12 }}>{v}</strong></div>)}
      </div>
      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 20, borderBottom: "1px solid rgba(148,163,184,.13)", flexWrap: "wrap" }}><div><small style={{ color: "#6295cc", letterSpacing: ".12em" }}>ÉVOLUTION</small><h2 style={{ margin: "5px 0" }}>{title}</h2></div><select value={metric} onChange={e => setMetric(e.target.value as typeof metric)} style={input}><option value="transaction_volume">Volume</option><option value="revenue">Revenus</option><option value="deposits">Dépôts</option><option value="withdrawals">Retraits</option><option value="new_users">Nouveaux utilisateurs</option></select></div>
        <div style={{ height: 390, padding: "28px 20px 20px", display: "flex", alignItems: "end", gap: 5, overflowX: "auto" }}>{loading ? <p>Chargement…</p> : error ? <p style={{ color: "#ff9da8" }}>{error}</p> : points.map(p => { const n = Number(p[metric] || 0); return <div key={p.date} title={`${fmt(p.date)} — ${metric === "new_users" ? n : money(n)}`} style={{ minWidth: 18, flex: 1, maxWidth: 34, height: "100%", display: "flex", flexDirection: "column", justifyContent: "end", alignItems: "center", gap: 7 }}><div style={{ width: "100%", height: `${Math.max(3, n / max * 100)}%`, background: "linear-gradient(180deg,#52a8ff,#155ed4)", borderRadius: "5px 5px 2px 2px" }} /><small style={{ color: "#60758e", fontSize: 9, whiteSpace: "nowrap" }}>{fmt(p.date)}</small></div> })}</div>
      </section>
    </div>
  </main>;
}

const label: React.CSSProperties = { display: "grid", gap: 5, color: "#8094aa", fontSize: 10, fontWeight: 700 };
const input: React.CSSProperties = { background: "#0a1424", color: "#dceaff", border: "1px solid rgba(148,163,184,.16)", borderRadius: 9, padding: "9px 10px", outline: "none" };
const button: React.CSSProperties = { background: "#1677ff", color: "white", border: 0, borderRadius: 9, padding: "10px 15px", fontWeight: 800, cursor: "pointer" };
const card: React.CSSProperties = { background: "linear-gradient(145deg,rgba(13,28,48,.94),rgba(7,18,32,.9))", border: "1px solid rgba(148,163,184,.13)", borderRadius: 15, padding: 18 };
const panel: React.CSSProperties = { background: "rgba(10,20,36,.82)", border: "1px solid rgba(148,163,184,.13)", borderRadius: 18, overflow: "hidden" };
