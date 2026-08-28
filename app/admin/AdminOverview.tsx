"use client";

import type { CSSProperties } from "react";

type Row = Record<string, any>;
type Module = "overview" | "users" | "kyc" | "transactions" | "wallets" | "ledger" | "deposits" | "withdrawals" | "disputes" | "support" | "notifications" | "revenue" | "invoices" | "settings" | "features" | "audit" | "admins" | "security";
type Props = { summary: Row; analytics: Row[]; days: number; setDays: (n: number) => void; navigate: (m: Module) => void };

const money = (v: any) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const num = (v: any) => Number(v ?? 0).toLocaleString("fr-FR");

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string,string> = {
    users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    transactions:"M7 7h12l-3-3M17 17H5l3 3M19 7a7 7 0 0 1-2 5M5 17a7 7 0 0 1 2-5",
    revenue:"M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8M20 16V4",
    deposits:"M12 3v13M7 11l5 5 5-5M4 21h16",
    withdrawals:"M12 21V8M7 13l5-5 5 5M4 3h16",
    disputes:"M12 3 3 7l9 4 9-4-9-4ZM3 12l9 4 9-4M3 17l9 4 9-4",
    support:"M4 5h16v12H8l-4 4V5ZM8 9h8M8 13h5",
    bell:"M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    report:"M6 2h9l5 5v15H6zM14 2v6h6M9 12h6M9 16h6",
    settings:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 12h2m14 0h2M12 3v2m0 14v2",
    alert:"M12 3 2.8 20h18.4L12 3ZM12 9v5M12 17h.01",
    check:"m5 12 4 4L19 6",
    arrow:"M5 12h14M13 6l6 6-6 6",
    activity:"M3 12h4l2-7 5 14 2-7h5",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.activity}/></svg>;
}

function RevenueChart({ data }: { data: Row[] }) {
  if (!data.length) return <div className="sp-empty-chart"><Icon name="activity" size={22}/><b>Aucune donnée pour cette période</b><span>Les revenus apparaîtront dès qu'une transaction générera une commission.</span></div>;
  const values = data.map(x => Number(x.revenue ?? x.safepay_revenue ?? 0));
  const max = Math.max(1, ...values);
  const points = values.map((v,i)=>`${(i/Math.max(1,values.length-1))*100},${92-(v/max)*70}`).join(" ");
  return <div className="sp-chart-wrap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Évolution des revenus"><defs><linearGradient id="safeRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(73,143,255,.32)"/><stop offset="1" stopColor="rgba(73,143,255,0)"/></linearGradient></defs><g className="sp-grid-lines"><path d="M0 20H100M0 44H100M0 68H100M0 92H100"/></g><polygon points={`0,100 ${points} 100,100`} fill="url(#safeRevenueFill)"/><polyline points={points} fill="none" stroke="#579eff" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/></svg><div className="sp-chart-labels"><span>{String(data[0]?.date ?? data[0]?.bucket ?? "").slice(0,10)}</span><span>{String(data[Math.floor(data.length/2)]?.date ?? data[Math.floor(data.length/2)]?.bucket ?? "").slice(0,10)}</span><span>{String(data[data.length-1]?.date ?? data[data.length-1]?.bucket ?? "").slice(0,10)}</span></div></div>;
}

function TrafficChart({ data }: { data: Row[] }) {
  if (!data.length) return <div className="sp-empty-chart"><Icon name="activity" size={22}/><b>Aucune donnée de trafic</b><span>Les statistiques apparaîtront avec l'activité de la plateforme.</span></div>;
  const points = data.slice(-12); const max = Math.max(1,...points.map(x=>Number(x.visitors ?? x.traffic ?? x.transactions ?? 0)));
  return <div className="sp-traffic"><div className="sp-traffic-grid">{[25,50,75,100].map(n=><i key={n} style={{bottom:`${n}%`} as CSSProperties}/>)}</div>{points.map((x,i)=>{const visitors=Number(x.visitors ?? x.traffic ?? x.transactions ?? 0);const signups=Number(x.signups ?? x.users ?? 0);return <div className="sp-traffic-col" key={`${x.date ?? x.bucket ?? i}-${i}`}><div className="sp-traffic-bars"><b style={{height:`${Math.max(6,visitors/max*100)}%`}}/><i style={{height:`${Math.max(5,signups/max*100)}%`}}/></div><small>{String(x.date ?? x.bucket ?? "").slice(5,10)}</small></div>})}</div>;
}

export default function AdminOverview({ summary, analytics, days, setDays, navigate }: Props) {
  const revenue = analytics.reduce((s,x)=>s+Number(x.revenue ?? x.safepay_revenue ?? 0),0);
  const volume = analytics.reduce((s,x)=>s+Number(x.transaction_volume ?? x.volume ?? 0),0);
  const traffic = analytics.reduce((s,x)=>s+Number(x.visitors ?? x.traffic ?? 0),0);
  const commission = Number(summary.commission_revenue_total ?? revenue);
  const cards = [
    ["Utilisateurs",num(summary.users_total),"Total utilisateurs","users","blue","users"],
    ["Transactions",num(summary.transactions_total),"Total transactions","transactions","cyan","transactions"],
    ["Volume total",money(summary.transactions_volume_total ?? volume),"Volume traité","revenue","green","revenue"],
    ["Commissions",money(commission),"Revenus SafePay","revenue","gold","revenue"],
  ];
  const alerts = [
    [Number(summary.disputes_open ?? 0),"Litiges en attente","Nécessitent votre attention","disputes"],
    [Number(summary.withdrawals_pending_count ?? 0),"Retraits en attente","Vérification requise","withdrawals"],
    [Number(summary.kyc_pending_count ?? 0),"KYC en attente","En attente de validation","kyc"],
  ];
  const actions: [Module,string,string,string][] = [["users","Utilisateur","Nouveau","users"],["transactions","Transaction","Consulter","transactions"],["disputes","Litige","Gérer","disputes"],["notifications","Notification","Envoyer","bell"],["invoices","Rapport","Générer","report"],["settings","Paramètres","Configurer","settings"]];
  return <div className="sp-overview-v2">
    <div className="sp-page-toolbar"><div><span className="sp-kicker">PILOTAGE</span><h2>Vue générale</h2><p>Bienvenue sur votre tableau de bord SafePay.</p></div><div className="sp-toolbar-actions"><label className="sp-period"><span>Période</span><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option><option value={365}>12 derniers mois</option></select></label></div></div>
    <section className="sp-kpi-grid">{cards.map(([label,value,sub,target,tone,icon])=><button className={`sp-kpi-card ${tone}`} key={label} onClick={()=>navigate(target as Module)}><span className="sp-kpi-icon"><Icon name={icon}/></span><span className="sp-kpi-copy"><small>{label}</small><strong>{value}</strong><em>{sub}</em></span><Icon name="arrow" size={15}/></button>)}</section>
    <section className="sp-main-grid">
      <article className="sp-card sp-chart-card"><div className="sp-card-head"><div><span className="sp-kicker">PERFORMANCE</span><h3>Évolution des revenus</h3><p><strong>{money(commission)}</strong><span className="sp-positive">Commissions SafePay</span></p></div><button onClick={()=>navigate("revenue")}>Voir les revenus <Icon name="arrow" size={14}/></button></div><RevenueChart data={analytics}/></article>
      <article className="sp-card sp-chart-card"><div className="sp-card-head"><div><span className="sp-kicker">ACQUISITION</span><h3>Trafic de la plateforme</h3><p><strong>{num(traffic)}</strong><span>visites sur la période</span></p></div><button onClick={()=>navigate("revenue")}>Détails</button></div><div className="sp-legend"><span><b/>Visiteurs</span><span><i/>Inscriptions</span></div><TrafficChart data={analytics}/></article>
      <aside className="sp-card sp-alert-card"><div className="sp-card-head"><div><span className="sp-kicker">SURVEILLANCE</span><h3>Alertes importantes</h3></div><span className="sp-alert-count">{num(alerts.reduce((s,a)=>s+Number(a[0]),0))}</span></div><div className="sp-alert-list">{alerts.map(([count,title,desc,target])=><button key={title} onClick={()=>navigate(target as Module)}><span className="sp-alert-icon"><Icon name={target === "kyc" ? "check" : target === "disputes" ? "disputes" : "alert"} size={16}/></span><span><b>{count} {title}</b><small>{desc}</small></span><Icon name="arrow" size={13}/></button>)}</div><button className="sp-link" onClick={()=>navigate("disputes")}>Voir les alertes <Icon name="arrow" size={14}/></button></aside>
    </section>
    <section className="sp-bottom-grid">
      <article className="sp-card"><div className="sp-card-head"><div><span className="sp-kicker">ACTIVITÉ</span><h3>Activité récente</h3></div><span className="sp-live-dot">● EN DIRECT</span></div><div className="sp-activity-list"><Activity icon="deposits" title="Dépôts réussis" value={money(summary.deposits_volume_successful)} meta="Aujourd'hui"/><Activity icon="transactions" title="Transactions" value={num(summary.transactions_total)} meta="Total"/><Activity icon="withdrawals" title="Retraits" value={money(summary.withdrawals_volume_successful)} meta="Sorties"/><Activity icon="disputes" title="Litiges ouverts" value={num(summary.disputes_open)} meta="À examiner"/></div><button className="sp-link" onClick={()=>navigate("transactions")}>Voir l'activité <Icon name="arrow" size={14}/></button></article>
      <article className="sp-card"><div className="sp-card-head"><div><span className="sp-kicker">OPÉRATIONS</span><h3>Statut des opérations</h3></div></div><div className="sp-status-body"><div className="sp-donut"><div><strong>{num(summary.transactions_total)}</strong><small>Total</small></div></div><div className="sp-status-legend"><span><i className="ok"/>Réussies <b>{num(summary.transactions_completed ?? 0)}</b></span><span><i className="progress"/>En cours <b>{num((summary.withdrawals_pending_count ?? 0)+(summary.deposits_pending_count ?? 0))}</b></span><span><i className="fail"/>Échouées <b>{num(summary.transactions_failed ?? 0)}</b></span></div></div><button className="sp-link" onClick={()=>navigate("transactions")}>Toutes les transactions <Icon name="arrow" size={14}/></button></article>
      <article className="sp-card"><div className="sp-card-head"><div><span className="sp-kicker">ACCÈS RAPIDE</span><h3>Actions rapides</h3></div></div><div className="sp-action-grid">{actions.map(([target,title,sub,icon])=><button key={title} onClick={()=>navigate(target)}><span><Icon name={icon}/></span><b>{title}</b><small>{sub}</small></button>)}</div></article>
      <aside className="sp-card sp-finance-card"><div className="sp-card-head"><div><span className="sp-kicker">FINANCE</span><h3>Résumé financier</h3></div></div><div className="sp-finance-list"><FinRow label="Dépôts" value={money(summary.deposits_volume_successful)}/><FinRow label="Retraits" value={money(summary.withdrawals_volume_successful)}/><FinRow label="Fonds bloqués" value={money(summary.wallets_total_locked)}/><FinRow label="Commissions" value={money(commission)} accent/></div><div className="sp-balance"><small>Revenu SafePay</small><strong>{money(commission)}</strong></div><button className="sp-primary-link" onClick={()=>navigate("revenue")}>Ouvrir les revenus <Icon name="arrow" size={14}/></button></aside>
    </section>
  </div>;
}
function Activity({icon,title,value,meta}:{icon:string;title:string;value:string;meta:string}){return <div className="sp-activity"><span className="sp-activity-icon"><Icon name={icon}/></span><span><b>{title}</b><small>{value}</small></span><time>{meta}</time></div>}
function FinRow({label,value,accent}:{label:string;value:string;accent?:boolean}){return <div className="sp-finance-row"><span>{label}</span><b className={accent?"accent":""}>{value}</b></div>}
