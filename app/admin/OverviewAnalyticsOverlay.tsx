"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Point = { date: string; transaction_volume: number; deposits: number; withdrawals: number; available_balance: number; locked_balance: number };

const money = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v || 0));
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function OverviewAnalyticsOverlay() {
  const today = iso(new Date());
  const initialStart = iso(new Date(Date.now() - 29 * 86400000));
  const [visible, setVisible] = useState(true);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<Point[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const detect = () => {
      const active = document.querySelector<HTMLElement>(".adm-sidebar nav button.active");
      const text = active?.textContent || "";
      setVisible(text.includes("Vue générale"));
    };
    detect();
    const observer = new MutationObserver(detect);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const r = await createClient().rpc("admin_dashboard_stats");
      if (!cancelled && r.data) setSummary(r.data);
    })();
    return () => { cancelled = true; };
  }, [visible]);

  useEffect(() => {
    if (!visible || startDate > endDate) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      const r = await createClient().rpc("admin_overview_timeseries", { p_start_date: startDate, p_end_date: endDate });
      if (cancelled) return;
      if (r.error) setError(r.error.message);
      else setData(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [visible, startDate, endDate]);

  const max = useMemo(() => Math.max(1, ...data.flatMap(d => [Number(d.transaction_volume), Number(d.deposits), Number(d.withdrawals), Number(d.available_balance), Number(d.locked_balance)])), [data]);
  if (!visible) return null;

  const preset = (days: number) => { setEndDate(today); setStartDate(iso(new Date(Date.now() - (days - 1) * 86400000))); };
  const series = [["transaction_volume", "Transactions", "1"], ["deposits", "Dépôts", ".72"], ["withdrawals", "Retraits", ".58"], ["available_balance", "Disponible", ".46"], ["locked_balance", "Bloqué", ".34"]] as const;
  const W = 1000, H = 320, P = 48;
  const point = (i: number, key: string) => { const x = P + (i / Math.max(1, data.length - 1)) * (W - 2 * P); const y = H - P - (Number(data[i]?.[key as keyof Point] || 0) / max) * (H - 2 * P); return `${x},${y}`; };

  return <section className="sp-overview-overlay">
    <div className="sp-overview-shell">
      <div className="sp-overview-top"><div><span>ANALYTICS · VUE GÉNÉRALE</span><h2>Trafic & activité SafePay</h2><p>Les chiffres restent fixes dans les KPI ; la courbe résume l'évolution sur la période choisie.</p></div><div className="sp-live">● Backend Supabase connecté</div></div>
      <div className="sp-kpis">{[["Utilisateurs", Number(summary.users_total ?? 0).toLocaleString("fr-FR")], ["Volume transactions", money(Number(summary.transactions_volume_total ?? 0))], ["Argent disponible", money(Number(summary.wallets_total_balance ?? 0))], ["Argent bloqué", money(Number(summary.wallets_total_locked ?? 0))], ["Dépôts", money(Number(summary.deposits_volume_successful ?? 0))], ["Retraits", money(Number(summary.withdrawals_volume_successful ?? 0))]].map(([a,b]) => <div className="sp-kpi" key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
      <div className="sp-chart-card">
        <div className="sp-toolbar"><div><b>Période d'analyse</b><small>{startDate} → {endDate}</small></div><div className="sp-presets"><button onClick={() => preset(7)}>7j</button><button onClick={() => preset(30)}>30j</button><button onClick={() => preset(90)}>90j</button><button onClick={() => preset(365)}>12m</button></div></div>
        <div className="sp-dates"><label>DU<input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} /></label><span>→</span><label>AU<input type="date" value={endDate} min={startDate} max={today} onChange={e => setEndDate(e.target.value)} /></label></div>
        {error && <div className="sp-error">{error}</div>}
        {loading ? <div className="sp-loading">Chargement des analytics…</div> : !data.length ? <div className="sp-loading">Aucune donnée sur cette période.</div> : <><div className="sp-chart-scroll"><svg viewBox={`0 0 ${W} ${H}`} width="100%" height="320" role="img" aria-label="Courbes de trafic SafePay">{[0,1,2,3,4].map(i => <line key={i} x1={P} y1={P + i * (H - 2*P) / 4} x2={W-P} y2={P + i * (H - 2*P) / 4} stroke="currentColor" opacity=".09" />)}{series.map(([key,,opacity]) => <polyline key={key} points={data.map((_,i) => point(i,key)).join(" ")} fill="none" stroke="currentColor" strokeWidth="3" opacity={Number(opacity)} strokeLinecap="round" strokeLinejoin="round" />)}{data.map((d,i) => <g key={d.date}>{series.map(([key,label,opacity]) => { const [x,y] = point(i,key).split(","); return <circle key={key} cx={x} cy={y} r="3" fill="currentColor" opacity={Number(opacity)}><title>{`${label} · ${d.date} · ${money(Number(d[key as keyof Point] || 0))}`}</title></circle>; })}</g>)}{[0, Math.floor((data.length-1)/2), data.length-1].filter((v,i,a) => a.indexOf(v) === i).map(i => <text key={i} x={P + (i/Math.max(1,data.length-1))*(W-2*P)} y={H-12} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".55">{data[i].date.slice(5)}</text>)}</svg></div><div className="sp-legend">{series.map(([key,label,opacity]) => <span key={key}><i style={{opacity:Number(opacity)}} />{label}</span>)}</div></>}
      </div>
      <div className="sp-note">Le graphique exclut volontairement le nombre d'utilisateurs : il reste présenté séparément comme indicateur global.</div>
    </div>
    <style jsx>{`.sp-overview-overlay{position:fixed;z-index:900;left:316px;right:0;top:0;bottom:0;overflow:auto;padding:26px;background:rgba(3,10,18,.98);color:#dfe9f5}.sp-overview-shell{max-width:1400px;margin:0 auto}.sp-overview-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.sp-overview-top span{font-size:11px;letter-spacing:.18em;opacity:.55}.sp-overview-top h2{margin:8px 0 5px;font-size:32px;color:#fff}.sp-overview-top p{margin:0;opacity:.62}.sp-live{border:1px solid rgba(80,180,255,.25);padding:10px 14px;border-radius:12px;font-size:12px;white-space:nowrap}.sp-kpis{display:grid;grid-template-columns:repeat(6,minmax(130px,1fr));gap:12px;margin-bottom:16px}.sp-kpi{padding:17px;border:1px solid rgba(130,170,210,.14);border-radius:16px;background:linear-gradient(145deg,rgba(18,38,61,.92),rgba(8,21,36,.92));box-shadow:0 12px 30px rgba(0,0,0,.18)}.sp-kpi span{display:block;font-size:12px;opacity:.62;margin-bottom:8px}.sp-kpi strong{font-size:22px;color:#fff}.sp-chart-card{border:1px solid rgba(130,170,210,.14);border-radius:18px;padding:20px;background:rgba(8,21,36,.92)}.sp-toolbar{display:flex;justify-content:space-between;gap:15px;align-items:center}.sp-toolbar b{display:block;font-size:16px}.sp-toolbar small{opacity:.5}.sp-presets{display:flex;gap:7px}.sp-presets button{border:1px solid rgba(130,170,210,.18);background:rgba(255,255,255,.04);color:inherit;border-radius:9px;padding:8px 12px;cursor:pointer}.sp-dates{display:flex;gap:12px;align-items:end;padding:16px 0}.sp-dates label{display:grid;gap:6px;font-size:10px;letter-spacing:.12em;opacity:.7}.sp-dates input{min-height:40px;padding:0 10px;border-radius:10px;border:1px solid rgba(130,170,210,.18);background:#0b1a2b;color:inherit}.sp-dates span{padding-bottom:11px;opacity:.4}.sp-chart-scroll{overflow-x:auto}.sp-legend{display:flex;gap:18px;flex-wrap:wrap;padding-top:10px;font-size:12px;opacity:.72}.sp-legend span{display:inline-flex;gap:7px;align-items:center}.sp-legend i{width:22px;height:3px;background:currentColor;border-radius:3px}.sp-loading{min-height:220px;display:grid;place-items:center;opacity:.5}.sp-error{padding:10px 12px;border:1px solid rgba(255,90,110,.25);border-radius:10px;color:#ff8795}.sp-note{margin-top:12px;font-size:12px;opacity:.45}@media(max-width:900px){.sp-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.sp-overview-overlay{left:0;top:62px;padding:14px}.sp-overview-top{display:block}.sp-live{margin-top:12px;display:inline-block}.sp-kpis{grid-template-columns:repeat(2,1fr)}.sp-overview-top h2{font-size:25px}}`}</style>
  </section>;
}
