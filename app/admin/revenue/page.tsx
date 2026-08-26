"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Point = { date: string; revenue?: number; safepay_revenue?: number; traffic?: number; transactions?: number; transaction_volume?: number };
type Summary = { available: number; pending: number; withdrawn: number; reversed: number; total: number; currency: string };
type Withdrawal = { id: string; amount: number; currency: string; provider: string; destination_phone: string; provider_reference: string | null; status: string; created_at: string };

const money = (n: number, currency = "XOF") => {
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(n)); }
  catch { return `${Number(n).toLocaleString("fr-FR")} ${currency}`; }
};
const card: React.CSSProperties = { background: "rgba(10,24,43,.92)", border: "1px solid rgba(82,168,255,.15)", borderRadius: 20, padding: 20, boxShadow: "0 18px 55px rgba(0,0,0,.18)" };
const input: React.CSSProperties = { width: "100%", background: "#071525", color: "#edf6ff", border: "1px solid rgba(148,163,184,.18)", borderRadius: 11, padding: "11px 12px", outline: "none" };
const button: React.CSSProperties = { background: "linear-gradient(135deg,#1984ff,#1261df)", color: "#fff", border: 0, borderRadius: 11, padding: "10px 14px", fontWeight: 800, cursor: "pointer" };
function monday(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); const day = x.getDay(); x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day)); return x; }
function iso(d: Date) { return d.toISOString().slice(0,10); }

export default function RevenuePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("T-Money");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [start, setStart] = useState(() => iso(monday(new Date())));
  const [end, setEnd] = useState(() => { const x = monday(new Date()); x.setDate(x.getDate() + 6); return iso(x); });
  const [currency] = useState("XOF");

  const load = async () => {
    const s = createClient();
    const [a,b,c] = await Promise.all([
      s.rpc("admin_revenue_summary"),
      s.rpc("admin_revenue_withdrawals", { p_limit: 50 }),
      s.rpc("admin_analytics_timeseries", { p_days: 365 })
    ]);
    if (a.error || b.error || c.error) { setMessage(a.error?.message || b.error?.message || c.error?.message || "Erreur de chargement"); return; }
    setSummary(a.data as Summary);
    setRows((b.data ?? []) as Withdrawal[]);
    setPoints((c.data ?? []) as Point[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => points.filter(p => String(p.date).slice(0,10) >= start && String(p.date).slice(0,10) <= end), [points,start,end]);
  const revenue = filtered.reduce((n,p) => n + Number(p.safepay_revenue ?? p.revenue ?? 0), 0);
  const traffic = filtered.reduce((n,p) => n + Number(p.traffic ?? p.transactions ?? p.transaction_volume ?? 0), 0);
  const maxRevenue = Math.max(1, ...filtered.map(p => Number(p.safepay_revenue ?? p.revenue ?? 0)));
  const maxTraffic = Math.max(1, ...filtered.map(p => Number(p.traffic ?? p.transactions ?? p.transaction_volume ?? 0)));
  const setWeek = (offset = 0) => { const s = monday(new Date()); s.setDate(s.getDate() + offset * 7); const e = new Date(s); e.setDate(e.getDate() + 6); setStart(iso(s)); setEnd(iso(e)); };

  async function withdraw() {
    const n = Number(amount), clean = phone.replace(/\s/g, "");
    if (!Number.isFinite(n) || n <= 0) return setMessage("Montant invalide.");
    if (!/^\+?[0-9]{8,15}$/.test(clean)) return setMessage("Numéro bénéficiaire invalide.");
    if (!summary || n > summary.available) return setMessage("Le montant dépasse le revenu disponible.");
    setBusy(true); setMessage("");
    try {
      const r = await createClient().functions.invoke("cinetpay-revenue-withdraw", { body: { amount:n, currency:"XOF", provider, phone:clean, idempotency_key:crypto.randomUUID() } });
      if (r.error) throw r.error;
      if (r.data?.error) throw new Error(r.data.message || r.data.error);
      setMessage(`Retrait créé : ${r.data.withdrawal_id}`); setAmount(""); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Retrait impossible"); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ background:"linear-gradient(135deg,#06101f,#081a32,#06101f)", color:"#f4f8ff", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"28px 22px 50px" }}>
        <div style={{ display:"flex", gap:16, marginBottom:22 }}><a href="/admin" style={{color:"#7fc0ff"}}>← Dashboard Admin</a><a href="/admin/financial" style={{color:"#7fc0ff"}}>Finance / Commissions</a></div>
        <header style={{marginBottom:20}}><div style={{color:"#59a9ff",fontSize:11,fontWeight:900,letterSpacing:".18em"}}>SAFEPAY • REVENUS</div><h1 style={{fontSize:38,margin:"7px 0"}}>Revenus & performance</h1><p style={{color:"#8fa6bf",maxWidth:720}}>Ce que SafePay gagne par commission et le trafic de la plateforme.</p></header>
        <section style={{...card,marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"end",flexWrap:"wrap"}}><div><div style={{color:"#59a9ff",fontSize:10,fontWeight:900}}>CALENDRIER ANALYTIQUE</div><h2 style={{margin:"6px 0"}}>Période du lundi au dimanche</h2></div><div style={{display:"flex",gap:8}}><button style={{...button,background:"#14365e"}} onClick={()=>setWeek(0)}>Cette semaine</button><button style={{...button,background:"#14365e"}} onClick={()=>setWeek(-1)}>Semaine précédente</button></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,marginTop:16,alignItems:"end"}}><label style={{fontSize:12,color:"#a8bad0"}}>Du<input type="date" value={start} onChange={e=>setStart(e.target.value)} style={input}/></label><label style={{fontSize:12,color:"#a8bad0"}}>Au<input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={input}/></label><button style={button} onClick={load}>Actualiser</button></div></section>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14,marginBottom:16}}>{[["Disponible",summary?.available??0],["Revenu période",revenue],["Trafic période",traffic],["Total historique",summary?.total??0]].map(([label,value],i)=><section key={String(label)} style={card}><div style={{color:"#8fa6bf",fontSize:12}}>{label}</div><strong style={{display:"block",fontSize:24,marginTop:8}}>{i===2?Number(value).toLocaleString("fr-FR"):money(Number(value),currency)}</strong><small style={{color:"#59a9ff"}}>{i===1?"Commissions SafePay":i===2?"Activité / transactions":"SafePay"}</small></section>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}><Chart title="Ce que SafePay gagne" total={money(revenue,currency)} data={filtered} max={maxRevenue} value={p=>Number(p.safepay_revenue??p.revenue??0)} label={p=>money(Number(p.safepay_revenue??p.revenue??0),currency)}/><Chart title="Trafic SafePay" total={traffic.toLocaleString("fr-FR")} data={filtered} max={maxTraffic} value={p=>Number(p.traffic??p.transactions??p.transaction_volume??0)} label={p=>`${Number(p.traffic??p.transactions??p.transaction_volume??0).toLocaleString("fr-FR")} activités`}/></div>
        <div style={{display:"grid",gridTemplateColumns:".8fr 1.2fr",gap:16,alignItems:"start"}}><section style={card}><div style={{color:"#59a9ff",fontSize:10,fontWeight:900}}>PAYOUT</div><h2>Retirer mes revenus</h2><p style={{color:"#8fa6bf",fontSize:13}}>Le montant est réservé avant l'appel CinetPay.</p><label>Montant<input style={input} value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,""))} placeholder="10000"/></label><label style={{display:"block",marginTop:12}}>Provider<select style={input} value={provider} onChange={e=>setProvider(e.target.value)}><option>T-Money</option><option>Moov Money</option></select></label><label style={{display:"block",marginTop:12}}>Numéro bénéficiaire<input style={input} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+228..."/></label><button style={{...button,width:"100%",marginTop:14}} disabled={busy||!summary||Number(amount)<=0} onClick={withdraw}>{busy?"Traitement…":"Demander le retrait"}</button></section><section style={card}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{color:"#59a9ff",fontSize:10,fontWeight:900}}>HISTORIQUE</div><h2>Retraits SafePay</h2></div><button style={{...button,background:"#14365e"}} onClick={load}>Actualiser</button></div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Date","Montant","Provider","Destination","Statut","Référence"].map(x=><th key={x} style={{textAlign:"left",padding:10,color:"#71869e"}}>{x}</th>)}</tr></thead><tbody>{rows.length ? rows.map(r=><tr key={r.id}><td style={{padding:10}}>{new Date(r.created_at).toLocaleString("fr-FR")}</td><td style={{padding:10,fontWeight:800}}>{money(r.amount,r.currency)}</td><td style={{padding:10}}>{r.provider}</td><td style={{padding:10}}>{r.destination_phone}</td><td style={{padding:10}}>{r.status}</td><td style={{padding:10,fontFamily:"monospace"}}>{r.provider_reference||"—"}</td></tr>) : <tr><td colSpan={6} style={{padding:24,textAlign:"center",color:"#71869e"}}>Aucun retrait pour le moment.</td></tr>}</tbody></table></div></section></div>
        {message && <div style={{...card,marginTop:16,color:"#b9d5ff"}}>{message}</div>}
      </div>
    </main>
  );
}

function Chart({title,total,data,max,value,label}:{title:string;total:string;data:Point[];max:number;value:(p:Point)=>number;label:(p:Point)=>string}) {
  const bars = data.map((p) => {
    const n = value(p);
    const height = `${Math.max(4, (n / max) * 100)}%`;
    return <div key={p.date} style={{flex:1,height,background:"linear-gradient(180deg,#52a8ff,#1261df)",borderRadius:"6px 6px 0 0",minWidth:4}} title={`${p.date} • ${label(p)}`} />;
  });
  return (
    <section style={card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:"#59a9ff",fontSize:10,fontWeight:900}}>ANALYTIQUE</div><h2 style={{margin:"5px 0"}}>{title}</h2></div><strong>{total}</strong></div>
      <div style={{height:250,display:"flex",alignItems:"end",gap:4,marginTop:18,borderBottom:"1px solid rgba(148,163,184,.12)",padding:"10px 0 0"}}>{bars.length > 0 ? bars : <div style={{color:"#8fa6bf",alignSelf:"center",width:"100%",textAlign:"center"}}>Aucune donnée sur cette période.</div>}</div>
      <div style={{display:"flex",justifyContent:"space-between",color:"#71869e",fontSize:10,marginTop:8}}><span>{data[0]?.date ?? "—"}</span><span>{data[data.length-1]?.date ?? "—"}</span></div>
    </section>
  );
}
