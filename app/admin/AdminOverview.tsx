"use client";

import type { CSSProperties } from "react";

type Row = Record<string, any>;
type Module = "overview" | "users" | "kyc" | "transactions" | "wallets" | "ledger" | "deposits" | "withdrawals" | "disputes" | "support" | "notifications" | "revenue" | "invoices" | "settings" | "features" | "audit" | "admins" | "security";

type Props = {
  summary: Row;
  analytics: Row[];
  days: number;
  setDays: (n: number) => void;
  navigate: (m: Module) => void;
};

const money = (v: any) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    transactions: "M7 7h12l-3-3M17 17H5l3 3M19 7a7 7 0 0 1-2 5M5 17a7 7 0 0 1 2-5",
    revenue: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8M20 16V4",
    deposits: "M12 3v13M7 11l5 5 5-5M4 21h16",
    withdrawals: "M12 21V8M7 13l5-5 5 5M4 3h16",
    disputes: "M12 3 3 7l9 4 9-4-9-4ZM3 12l9 4 9-4M3 17l9 4 9-4",
    support: "M4 5h16v12H8l-4 4V5ZM8 9h8M8 13h5",
    search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4",
    arrow: "M5 12h14M13 6l6 6-6 6",
    alert: "M12 3 2.8 20h18.4L12 3ZM12 9v5M12 17h.01",
    check: "m5 12 4 4L19 6",
    activity: "M3 12h4l2-7 5 14 2-7h5",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    report: "M6 2h9l5 5v15H6zM14 2v6h6M9 12h6M9 16h6",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 12h2m14 0h2M12 3v2m0 14v2",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.activity} /></svg>;
}

function LineChart({ data }: { data: Row[] }) {
  if (!data.length) return <div className="sp-chart-empty">Aucune donnée pour la période sélectionnée.</div>;
  const values = data.map((x) => Number(x.revenue ?? x.transaction_volume ?? 0));
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${92 - (v / max) * 72}`).join(" ");
  return <div className="sp-line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="spRevenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgba(55,145,255,.30)"/><stop offset="1" stopColor="rgba(55,145,255,0)"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#spRevenueFill)"/><polyline points={points} fill="none" stroke="#4c9dff" strokeWidth="1.7" vectorEffect="non-scaling-stroke"/></svg><div className="sp-chart-axis"><span>{String(data[0]?.date ?? "").slice(5)}</span><span>{String(data[Math.floor(data.length / 2)]?.date ?? "").slice(5)}</span><span>{String(data[data.length - 1]?.date ?? "").slice(5)}</span></div></div>;
}

function TrafficChart({ data }: { data: Row[] }) {
  if (!data.length) return <div className="sp-chart-empty">Aucune donnée de trafic.</div>;
  const max = Math.max(1, ...data.map((x) => Number(x.visitors ?? x.traffic ?? x.transactions ?? 0)));
  return <div className="sp-traffic-chart">{data.slice(-12).map((x, i) => { const visitors = Number(x.visitors ?? x.traffic ?? x.transactions ?? 0); const signups = Number(x.signups ?? x.users ?? 0); return <div className="sp-traffic-col" key={`${x.date ?? i}-${i}`}><div className="sp-traffic-bars"><i style={{ height: `${Math.max(8, visitors / max * 100)}%` } as CSSProperties}/><b style={{ height: `${Math.max(5, signups / max * 100)}%` } as CSSProperties}/></div><small>{String(x.date ?? "").slice(5)}</small></div>; })}</div>;
}

export default function AdminOverview({ summary, analytics, days, setDays, navigate }: Props) {
  const revenue = analytics.reduce((s, x) => s + Number(x.revenue ?? 0), 0);
  const volume = analytics.reduce((s, x) => s + Number(x.transaction_volume ?? 0), 0);
  const traffic = analytics.reduce((s, x) => s + Number(x.visitors ?? x.traffic ?? 0), 0);
  const cards = [
    ["Utilisateurs", Number(summary.users_total ?? 0).toLocaleString("fr-FR"), "Total", "users", "blue", "users"],
    ["Transactions", Number(summary.transactions_total ?? 0).toLocaleString("fr-FR"), "Total", "transactions", "cyan", "transactions"],
    ["Volume total", money(summary.transactions_volume_total ?? volume), "Volume traité", "revenue", "green", "revenue"],
    ["Commissions", money(summary.commission_revenue_total ?? revenue), "Revenus SafePay", "revenue", "gold", "revenue"],
  ];
  const alerts = [
    [Number(summary.disputes_open ?? 0), "Litiges en attente", "Nécessitent votre attention", "disputes"],
    [Number(summary.withdrawals_pending_count ?? 0), "Retraits en attente", "Vérification requise", "withdrawals"],
    [Number(summary.kyc_pending_count ?? 0), "KYC en attente", "En attente de validation", "kyc"],
  ];
  return <div className="sp-overview-v2">
    <div className="sp-period-row"><div><span className="sp-kicker">PILOTAGE</span><h2>Vue générale</h2><p>Une vue claire et instantanée de l'activité SafePay.</p></div><label className="sp-period"><span>Période</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option><option value={365}>12 derniers mois</option></select></label></div>
    <section className="sp-kpi-grid">{cards.map(([label, value, sub, target, tone, icon]) => <button className={`sp-kpi-card ${tone}`} key={label} onClick={() => navigate(target as Module)}><div className="sp-kpi-icon"><Icon name={icon}/></div><div className="sp-kpi-copy"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div><Icon name="arrow" size={16}/></button>)}</section>
    <section className="sp-main-grid"><div className="sp-card sp-revenue-card"><div className="sp-card-head"><div><span className="sp-kicker">ANALYTIQUE</span><h3>Évolution des revenus</h3><p><strong>{money(summary.commission_revenue_total ?? revenue)}</strong> <span className="sp-positive">+15,3%</span></p></div><button onClick={() => navigate("revenue")}>Voir les revenus <Icon name="arrow" size={14}/></button></div><LineChart data={analytics}/></div><div className="sp-card sp-traffic-card"><div className="sp-card-head"><div><span className="sp-kicker">ANALYTIQUE</span><h3>Trafic de la plateforme</h3><p><strong>{traffic.toLocaleString("fr-FR")}</strong> visites <span className="sp-positive">+12,5%</span></p></div><button onClick={() => navigate("revenue")}>Détails</button></div><div className="sp-legend"><span><i/>Visiteurs</span><span><b/>Inscriptions</span></div><TrafficChart data={analytics}/></div><aside className="sp-card sp-alert-card"><div className="sp-card-head"><div><span className="sp-kicker">SURVEILLANCE</span><h3>Alertes importantes</h3></div><span className="sp-alert-count">{alerts.reduce((s, a) => s + Number(a[0]), 0)}</span></div><div className="sp-alert-list">{alerts.map(([count, title, desc, target]) => <button key={title} onClick={() => navigate(target as Module)}><span className="sp-alert-icon"><Icon name={target === "kyc" ? "check" : target === "disputes" ? "disputes" : "alert"} size={16}/></span><span><b>{count} {title}</b><small>{desc}</small></span><Icon name="arrow" size={14}/></button>)}</div><button className="sp-link" onClick={() => navigate("disputes")}>Voir toutes les alertes <Icon name="arrow" size={14}/></button></aside></section>
    <section className="sp-bottom-grid"><div className="sp-card sp-activity-card"><div className="sp-card-head"><div><span className="sp-kicker">ACTIVITÉ</span><h3>Activité récente</h3></div><button className="sp-icon-button" aria-label="Actualiser"><Icon name="activity"/></button></div><div className="sp-activity-list"><Activity icon="deposits" title="Nouveau dépôt" value={money(summary.deposits_volume_successful)} meta="Aujourd'hui"/><Activity icon="transactions" title="Transactions sécurisées" value={Number(summary.transactions_total ?? 0).toLocaleString("fr-FR")} meta="Activité globale"/><Activity icon="withdrawals" title="Retraits" value={money(summary.withdrawals_volume_successful)} meta="Flux sortants"/><Activity icon="disputes" title="Litiges ouverts" value={String(summary.disputes_open ?? 0)} meta="À examiner"/></div><button className="sp-link">Voir toute l'activité <Icon name="arrow" size={14}/></button></div><div className="sp-card sp-status-card"><div className="sp-card-head"><div><span className="sp-kicker">OPÉRATIONS</span><h3>Statut des opérations</h3></div></div><div className="sp-status-body"><div className="sp-donut"><div><strong>{Number(summary.transactions_total ?? 0).toLocaleString("fr-FR")}</strong><small>Total</small></div></div><div className="sp-status-legend"><span><i className="ok"/>Réussies <b>—</b></span><span><i className="progress"/>En cours <b>{summary.withdrawals_pending_count ?? 0}</b></span><span><i className="fail"/>Échouées <b>—</b></span></div></div><button className="sp-link" onClick={() => navigate("transactions")}>Voir les transactions <Icon name="arrow" size={14}/></button></div><div className="sp-card sp-actions-card"><div className="sp-card-head"><div><span className="sp-kicker">ACCÈS RAPIDE</span><h3>Actions rapides</h3></div></div><div className="sp-action-grid">{[["users","Utilisateur","Nouveau","users"],["transactions","Transaction","Créer","transactions"],["disputes","Litige","Ouvrir","disputes"],["notifications","Notification","Envoyer","bell"],["invoices","Rapport","Générer","report"],["settings","Paramètres","Configurer","settings"]].map(([target,title,sub,icon]) => <button key={title} onClick={() => navigate(target as Module)}><span><Icon name={icon}/></span><b>{title}</b><small>{sub}</small></button>)}</div></div><aside className="sp-card sp-finance-card"><div className="sp-card-head"><div><span className="sp-kicker">FINANCE</span><h3>Résumé financier</h3></div></div><div className="sp-finance-list"><Row label="Dépôts" value={money(summary.deposits_volume_successful)} positive/><Row label="Retraits" value={money(summary.withdrawals_volume_successful)} positive/><Row label="Fonds bloqués" value={money(summary.wallets_total_locked)}/><Row label="Remboursements" value="—"/></div><div className="sp-balance"><small>Solde SafePay</small><strong>{money(summary.wallets_total_balance)}</strong></div><button className="sp-primary-link" onClick={() => navigate("revenue")}>Voir le rapport financier <Icon name="arrow" size={14}/></button></aside></section>
  </div>;
}

function Activity({ icon, title, value, meta }: { icon: string; title: string; value: string; meta: string }) { return <div className="sp-activity"><span className="sp-activity-icon"><Icon name={icon}/></span><span><b>{title}</b><small>{value}</small></span><time>{meta}</time></div>; }
function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) { return <div className="sp-finance-row"><span>{label}</span><b>{value}</b>{positive && <i>+</i>}</div>; }
