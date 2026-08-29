"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const money = (v: unknown) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const date = (v: unknown) => v ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(v))) : "—";

type Item = Record<string, any>;

export default function AdminFinancePage() {
  const [tab, setTab] = useState("fees");
  const [rows, setRows] = useState<Item[]>([]);
  const [providers, setProviders] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const s = createClient();
    const gate = await s.rpc("is_admin");
    if (gate.error || !gate.data) { setError("Accès administrateur requis."); setLoading(false); return; }
    let result: any;
    if (tab === "fees") result = await s.rpc("admin_list_platform_fees", { p_limit: 100, p_offset: 0 });
    if (tab === "revenue") result = await s.rpc("admin_list_revenue_ledger", { p_limit: 100, p_offset: 0 });
    if (tab === "payouts") result = await s.rpc("admin_list_revenue_withdrawals", { p_limit: 100, p_offset: 0 });
    if (tab === "providers") result = await s.rpc("admin_list_payment_providers");
    if (result?.error) setError(result.error.message);
    else if (tab === "providers") setProviders(Array.isArray(result?.data) ? result.data : []);
    else setRows(Array.isArray(result?.data?.items) ? result.data.items : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab]);

  return <main style={{minHeight:"100vh",background:"#050b14",color:"#eef6ff",fontFamily:"Inter,system-ui,sans-serif",padding:"28px",maxWidth:1500,margin:"auto"}}>
    <a href="/admin" style={{color:"#79bfff",textDecoration:"none",fontSize:13}}>← Retour au Dashboard Admin</a>
    <header style={{margin:"26px 0 22px"}}><div style={{fontSize:11,letterSpacing:2,color:"#6f9bc3",fontWeight:800}}>SAFE PAY / FINANCE</div><h1 style={{fontSize:34,margin:"7px 0"}}>Finance & opérations</h1><p style={{color:"#91a8bc",margin:0}}>Commissions, revenus SafePay, retraits de revenus et prestataires de paiement.</p></header>
    <nav style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>{[["fees","Platform fees"],["revenue","Ledger revenus"],["payouts","Retraits SafePay"],["providers","Prestataires"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"10px 14px",borderRadius:10,border:"1px solid rgba(130,190,240,.18)",background:tab===k?"#12365a":"#091728",color:"#dbeeff",cursor:"pointer"}}>{l}</button>)}</nav>
    {error && <div style={{padding:14,borderRadius:10,background:"#321722",border:"1px solid #6b3040",color:"#ffb5c1",marginBottom:15}}>{error}</div>}
    {loading ? <div style={{padding:60,textAlign:"center",color:"#7e96aa"}}>Chargement sécurisé…</div> : tab === "providers" ? <ProviderTable rows={providers}/> : <FinanceTable tab={tab} rows={rows}/>} 
  </main>;
}

function FinanceTable({ tab, rows }: {tab:string;rows:Item[]}) {
  const cols = tab === "fees" ? ["amount","currency","reason","transaction_id","withdrawal_id","created_at"] : tab === "revenue" ? ["source_type","amount","currency","status","source_reference","available_at","created_at"] : ["amount","currency","provider","destination_phone","provider_reference","status","created_at","completed_at"];
  return <section style={{overflowX:"auto",border:"1px solid rgba(130,190,240,.14)",borderRadius:14,background:"#091625"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}><thead><tr>{cols.map(c=><th key={c} style={{padding:14,textAlign:"left",fontSize:11,color:"#8eabc4",textTransform:"uppercase",borderBottom:"1px solid rgba(130,190,240,.12)"}}>{c.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id??i}>{cols.map(c=><td key={c} style={{padding:14,fontSize:12,borderBottom:"1px solid rgba(130,190,240,.07)"}}>{/amount|fee/.test(c)?money(r[c]):/created|updated|available|completed/.test(c)?date(r[c]):String(r[c]??"—")}</td>)}</tr>)}{!rows.length&&<tr><td colSpan={cols.length} style={{padding:55,textAlign:"center",color:"#70879c"}}>Aucune donnée.</td></tr>}</tbody></table></section>;
}

function ProviderTable({rows}:{rows:Item[]}) { return <section style={{display:"grid",gap:12}}>{rows.map((p:any)=><article key={p.id} style={{padding:18,border:"1px solid rgba(130,190,240,.14)",borderRadius:14,background:"#091625"}}><div style={{display:"flex",justifyContent:"space-between",gap:15}}><div><strong>{p.name}</strong><div style={{color:"#7893aa",fontSize:12,marginTop:5}}>{p.code}</div></div><span style={{color:p.active?"#55d99b":"#ff8292"}}>{p.active?"ACTIF":"INACTIF"}</span></div><div style={{marginTop:14,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>{(p.methods??[]).map((m:any)=><div key={m.id} style={{padding:12,background:"#071220",borderRadius:10}}><b style={{fontSize:12}}>{m.name}</b><small style={{display:"block",color:"#7893aa",marginTop:4}}>{m.code} · {m.currency}</small><small style={{display:"block",color:"#7893aa",marginTop:3}}>Collecte: {m.collection_enabled?"ON":"OFF"} · Payout: {m.payout_enabled?"ON":"OFF"}</small></div>)}</div></article>)}{!rows.length&&<div style={{padding:55,textAlign:"center",color:"#70879c"}}>Aucun prestataire configuré.</div>}</section>; }
