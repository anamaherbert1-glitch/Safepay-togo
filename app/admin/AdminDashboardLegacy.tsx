"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminStyles from "./AdminStyles";

type Row = Record<string, any>;
type Module = "overview" | "users" | "kyc" | "transactions" | "wallets" | "ledger" | "deposits" | "withdrawals" | "disputes" | "support" | "notifications" | "revenue" | "invoices" | "settings" | "features" | "audit" | "admins" | "security";
type Setting = { key: string; label: string; description: string; type: "number" | "boolean"; value: number | boolean; unit?: string };
type Dialog = { kind: "notify" | "support" | "kyc" | "dispute" | "withdrawal" | "admin"; row?: Row } | null;

const modules: [Module, string, string][] = [
  ["overview", "Vue générale", "Pilotage SafePay"], ["users", "Utilisateurs", "Comptes & activité"], ["kyc", "KYC", "Vérifications"],
  ["transactions", "Transactions", "Flux financiers"], ["wallets", "Wallets", "Soldes"], ["ledger", "Ledger", "Journal financier"],
  ["deposits", "Dépôts", "Recharges"], ["withdrawals", "Retraits", "Payouts"], ["disputes", "Litiges", "Escrow & résolution"],
  ["support", "Support", "Tickets clients"], ["notifications", "Notifications", "Communication"], ["revenue", "Revenus", "Platform fees"],
  ["invoices", "Factures", "Documents"], ["settings", "Paramètres", "Règles métier"], ["features", "Fonctionnalités", "Feature flags"],
  ["audit", "Audit logs", "Traçabilité"], ["admins", "Administrateurs", "Accès"], ["security", "Sécurité", "Contrôles"],
];

const settingsDefault: Setting[] = [
  { key: "commission_rate_percent", label: "Commission SafePay", description: "Commission appliquée aux transactions.", type: "number", value: 2, unit: "%" },
  { key: "deposit_fee_percent", label: "Frais dépôt", description: "Frais de recharge.", type: "number", value: 0, unit: "%" },
  { key: "withdrawal_fee_percent", label: "Frais retrait", description: "Frais de retrait.", type: "number", value: 0, unit: "%" },
  { key: "minimum_transaction_amount", label: "Minimum transaction", description: "Montant minimum autorisé.", type: "number", value: 100, unit: "XOF" },
  { key: "maximum_transaction_amount", label: "Maximum transaction", description: "Montant maximum autorisé.", type: "number", value: 1000000, unit: "XOF" },
  { key: "daily_withdrawal_limit", label: "Limite retrait / jour", description: "Plafond journalier de retrait.", type: "number", value: 1000000, unit: "XOF" },
  { key: "maintenance_mode", label: "Mode maintenance", description: "Suspendre temporairement les opérations.", type: "boolean", value: false },
  { key: "notifications_enabled", label: "Notifications plateforme", description: "Autoriser les notifications SafePay.", type: "boolean", value: true },
];

const fields: Record<Module, string[]> = {
  overview: [], users: ["full_name", "phone", "country", "role", "phone_verified", "kyc_status", "is_active", "created_at"],
  kyc: ["full_name", "phone", "country", "kyc_status", "kyc_document_type", "kyc_submitted_at", "kyc_verified_at"],
  transactions: ["id", "amount", "commission", "currency", "status", "description", "seller_phone", "created_at"],
  wallets: ["id", "phone", "balance", "locked_balance", "withdrawal_reserved", "currency", "updated_at"],
  ledger: ["id", "entry_type", "amount", "balance_before", "balance_after", "locked_before", "locked_after", "description", "created_at"],
  deposits: ["id", "name", "phone", "amount", "currency", "provider", "status", "provider_reference", "created_at"],
  withdrawals: ["id", "name", "phone", "amount", "fee_amount", "net_amount", "currency", "provider", "status", "provider_reference", "created_at"],
  disputes: ["id", "transaction_id", "opened_by", "reason", "status", "resolution_action", "created_at", "resolved_at"],
  support: ["id", "user_id", "name", "phone", "message", "status", "created_at", "updated_at"],
  notifications: [], revenue: [], invoices: ["id", "invoice_number", "transaction_id", "amount", "commission", "net_seller", "currency", "status", "issued_at", "pdf_generated_at"],
  settings: [], features: [], audit: ["id", "actor_name", "actor_phone", "action", "target_table", "target_id", "details", "created_at"],
  admins: ["user_id", "name", "phone", "role", "is_active", "created_at"], security: [],
};

const money = (v: any) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const date = (v: any) => v ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";
const display = (v: any) => v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
const labelize = (key: string) => key.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
const isMoney = (key: string) => /amount|balance|volume|fee|commission|net_seller/i.test(key);
const isDate = (key: string) => /created_at|updated_at|submitted_at|verified_at|issued_at|generated_at|resolved_at/i.test(key);

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    overview: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6", users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", kyc: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3ZM9 12l2 2 4-5", transactions: "M7 7h12l-3-3M17 17H5l3 3M19 7a7 7 0 0 1-2 5M5 17a7 7 0 0 1 2-5", wallets: "M3 7h18v13H3zM3 7l2-4h14l2 4M16 13h5", ledger: "M6 3h12v18H6zM9 7h6M9 11h6M9 15h4", deposits: "M12 3v13M7 11l5 5 5-5M4 21h16", withdrawals: "M12 21V8M7 13l5-5 5 5M4 3h16", disputes: "M12 3 3 7l9 4 9-4-9-4ZM3 12l9 4 9-4M3 17l9 4 9-4", support: "M4 5h16v12H8l-4 4V5ZM8 9h8M8 13h5", notifications: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4", revenue: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8M20 16V4", invoices: "M6 2h9l5 5v15H6zM14 2v6h6M9 12h6M9 16h6", settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 12h2m14 0h2M12 3v2m0 14v2", features: "M12 2l2.8 6.2L21 9l-4.5 4.3L17.7 20 12 16.8 6.3 20l1.2-6.7L3 9l6.2-.8L12 2Z", audit: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h5", admins: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0", security: "M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3ZM9 12l2 2 4-5", search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4", refresh: "M20 11a8.1 8.1 0 0 0-15-3M4 4v4h4M4 13a8.1 8.1 0 0 0 15 3M20 20v-4h-4", arrow: "M5 12h14M13 6l6 6-6 6", check: "m5 12 4 4L19 6", close: "M6 6l12 12M18 6 6 18", menu: "M4 7h16M4 12h16M4 17h16", logout: "M10 17l5-5-5-5M15 12H3M21 4v16", eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6", plus: "M12 5v14M5 12h14",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.settings} /></svg>;
}

export default function AdminPage() {
  const router = useRouter();
  const [active, setActive] = useState<Module>("overview"); const [rows, setRows] = useState<Row[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [summary, setSummary] = useState<Row>({}); const [settings, setSettings] = useState(settingsDefault); const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [analytics, setAnalytics] = useState<Row[]>([]); const [days, setDays] = useState(30); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [toast, setToast] = useState(""); const [mobileNav, setMobileNav] = useState(false); const [dialog, setDialog] = useState<Dialog>(null); const size = 20;
  const current = modules.find((m) => m[0] === active)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = createClient(); const { data: { user } } = await s.auth.getUser();
      if (!user) { router.replace("/login?next=/admin"); return; }
      const gate = await s.rpc("is_admin");
      if (gate.error || !gate.data) { if (!cancelled) { setError("Accès administrateur requis."); setLoading(false); } return; }
      const [pub, stats, ff, series] = await Promise.all([s.rpc("get_public_settings"), s.rpc("admin_dashboard_stats"), s.from("feature_flags").select("key,enabled"), s.rpc("admin_analytics_timeseries", { p_days: 30 })]);
      if (cancelled) return;
      if (pub.data) setSettings(settingsDefault.map((x) => ({ ...x, value: pub.data[x.key] ?? x.value })));
      if (stats.data) setSummary(stats.data); if (ff.data) setFlags(Object.fromEntries(ff.data.map((x: any) => [x.key, Boolean(x.enabled)]))); if (Array.isArray(series.data)) setAnalytics(series.data);
      setLoading(false);
    })().catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Erreur de chargement"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => { if (!loading && !["overview", "settings", "features", "notifications", "security", "revenue"].includes(active)) loadModule(); }, [active, page, status, search, loading]);
  useEffect(() => { if (!loading && (active === "revenue" || active === "overview")) loadRevenue(); }, [days, loading, active]);

  async function loadModule() {
    const s = createClient(); setError(""); let r: any; const q = search.trim() || null;
    if (active === "users") r = await s.rpc("admin_list_users", { p_search: q, p_limit: size, p_offset: page * size });
    if (active === "kyc") r = await s.rpc("admin_list_kyc", { p_status: status || null, p_limit: size, p_offset: page * size });
    if (active === "transactions") r = await s.rpc("admin_list_transactions", { p_search: q, p_status: status || null, p_limit: size, p_offset: page * size });
    if (active === "wallets") r = await s.rpc("admin_list_wallets", { p_search: q, p_limit: size, p_offset: page * size });
    if (active === "ledger") r = await s.rpc("admin_list_ledger", { p_search: q, p_limit: size, p_offset: page * size });
    if (active === "deposits") r = await s.rpc("admin_list_deposits", { p_search: q, p_status: status || null, p_limit: size, p_offset: page * size });
    if (active === "withdrawals") r = await s.rpc("admin_list_withdrawals", { p_search: q, p_status: status || null, p_limit: size, p_offset: page * size });
    if (active === "disputes") r = await s.rpc("admin_list_disputes", { p_status: status || null, p_limit: size, p_offset: page * size });
    if (active === "support") r = await s.rpc("admin_list_support_tickets", { p_status: status || null, p_limit: size, p_offset: page * size });
    if (active === "audit") r = await s.rpc("admin_list_audit_logs", { p_limit: size, p_offset: page * size });
    if (active === "invoices") r = await s.rpc("admin_list_invoices", { p_search: q, p_limit: size, p_offset: page * size });
    if (active === "admins") r = await s.rpc("admin_list_admin_users", { p_limit: size, p_offset: page * size });
    if (!r) return; if (r.error) { setError(r.error.message); setRows([]); return; }
    const data = r.data; setRows(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []); setTotal(Number(data?.total ?? (Array.isArray(data) ? data.length : 0)));
  }

  async function loadRevenue() { const r = await createClient().rpc("admin_analytics_timeseries", { p_days: days }); if (r.error) setError(r.error.message); else setAnalytics(Array.isArray(r.data) ? r.data : []); }
  async function refresh() {
    setError(""); setToast("");
    if (active === "overview" || active === "revenue") { const [s, a] = await Promise.all([createClient().rpc("admin_dashboard_stats"), createClient().rpc("admin_analytics_timeseries", { p_days: days })]); if (s.data) setSummary(s.data); if (a.data) setAnalytics(a.data); if (s.error) setError(s.error.message); return; }
    if (active === "settings") { const r = await createClient().rpc("get_public_settings"); if (r.data) setSettings(settingsDefault.map((x) => ({ ...x, value: r.data[x.key] ?? x.value }))); return; }
    if (active === "features") { const r = await createClient().from("feature_flags").select("key,enabled"); if (r.data) setFlags(Object.fromEntries(r.data.map((x: any) => [x.key, Boolean(x.enabled)]))); return; }
    if (active !== "notifications" && active !== "security") await loadModule();
  }
  async function rpc(name: string, args: Record<string, any>) {
    setBusy(true); setError(""); setToast(""); const r = await createClient().rpc(name, args); setBusy(false);
    if (r.error) { setError(r.error.message); return false; } setToast("Modification enregistrée dans SafePay."); await refresh(); return true;
  }
  function navigate(next: Module) { setActive(next); setPage(0); setSearch(""); setStatus(""); setMobileNav(false); setError(""); }
  function logout() { createClient().auth.signOut().finally(() => router.replace("/login")); }

  const columns = useMemo(() => fields[active].length ? fields[active] : [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => !["details", "password", "secret", "token"].includes(k)).slice(0, 8), [active, rows]);
  const actionFor = (r: Row) => {
    if (active === "users") return <div className="adm-actions"><button onClick={() => setDialog({ kind: "notify", row: r })}>Notifier</button><button className={r.is_active ? "danger" : ""} onClick={() => rpc("admin_set_account_status", { p_user_id: r.id, p_is_active: !Boolean(r.is_active), p_reason: r.is_active ? "Blocage par administrateur" : "Réactivation par administrateur" })}>{r.is_active ? "Bloquer" : "Réactiver"}</button></div>;
    if (active === "kyc") return <div className="adm-actions"><button onClick={() => setDialog({ kind: "kyc", row: r })}>Examiner</button></div>;
    if (active === "withdrawals" && r.status === "pending") return <button onClick={() => setDialog({ kind: "withdrawal", row: r })}>Traiter</button>;
    if (active === "disputes" && r.status !== "resolved") return <button onClick={() => setDialog({ kind: "dispute", row: r })}>Résoudre</button>;
    if (active === "support") return <div className="adm-actions"><button onClick={() => setDialog({ kind: "support", row: r })}>Répondre</button><button className="ghost" onClick={() => rpc("admin_update_support_ticket_status", { p_ticket_id: r.id, p_status: r.status === "closed" ? "open" : "closed" })}>{r.status === "closed" ? "Rouvrir" : "Fermer"}</button></div>;
    if (active === "admins") return <button className="danger" onClick={() => setDialog({ kind: "admin", row: r })}>Retirer</button>;
    return <button className="ghost" onClick={() => setToast("Données en lecture seule — les opérations financières restent contrôlées par le backend SafePay.")}>Détails</button>;
  };

  if (loading) return <main className="adm-loading"><AdminStyles/><div className="adm-loader"><div className="adm-logo">S</div><h2>SafePay Admin</h2><p>Connexion sécurisée au centre d'administration…</p><span /></div></main>;
  if (error === "Accès administrateur requis.") return <main className="adm-loading"><AdminStyles/><div className="adm-access"><Icon name="security" size={42}/><h2>Accès administrateur requis</h2><p>Votre compte ne possède pas les permissions nécessaires.</p><button onClick={() => router.push("/dashboard")}>Retour à SafePay</button></div></main>;

  return <main className="adm-app"><AdminStyles/>
    <aside className={`adm-sidebar ${mobileNav ? "open" : ""}`}>
      <div className="adm-brand"><div className="adm-brand-mark">S</div><div><strong>SafePay</strong><span>ADMIN CONSOLE</span></div></div>
      <div className="adm-nav-label">PILOTAGE</div><nav>{modules.slice(0, 13).map(([key, label, desc]) => <button key={key} className={active === key ? "active" : ""} onClick={() => navigate(key)}><Icon name={key}/><span><b>{label}</b><small>{desc}</small></span></button>)}</nav>
      <div className="adm-nav-label">CONFIGURATION & SÉCURITÉ</div><nav>{modules.slice(13).map(([key, label, desc]) => <button key={key} className={active === key ? "active" : ""} onClick={() => navigate(key)}><Icon name={key}/><span><b>{label}</b><small>{desc}</small></span></button>)}</nav>
      <div className="adm-side-footer"><div className="adm-avatar">A</div><div><b>Administrateur</b><small>Accès contrôlé par Supabase</small></div><button onClick={logout} aria-label="Déconnexion"><Icon name="logout" size={17}/></button></div>
    </aside>
    <section className="adm-main">
      <header className="adm-header"><button className="adm-mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu"><Icon name="menu"/></button><div className="adm-heading"><div className="adm-eyebrow">SAFE PAY / ADMINISTRATION</div><h1>{current[1]}</h1><p>{current[2]}</p></div><div className="adm-header-right"><div className="adm-live"><i/> Backend SafePay connecté</div><button className="adm-refresh" onClick={refresh} aria-label="Actualiser"><Icon name="refresh"/></button></div></header>
      <div className="adm-content">{toast && <div className="adm-toast"><Icon name="check" size={16}/>{toast}<button onClick={() => setToast("")}><Icon name="close" size={15}/></button></div>}{error && <div className="adm-error">{error}</div>}
        {active === "overview" && <Overview summary={summary} analytics={analytics} days={days} setDays={setDays} navigate={navigate}/>} 
        {active === "settings" && <Settings settings={settings} setSettings={setSettings} busy={busy} rpc={rpc}/>} 
        {active === "features" && <Features flags={flags} setFlags={setFlags} busy={busy} rpc={rpc}/>} 
        {active === "notifications" && <NotificationCenter busy={busy} rpc={rpc}/>} 
        {active === "security" && <SecurityCenter/>}
        {active === "revenue" && <Revenue analytics={analytics} days={days} setDays={setDays}/>} 
        {!(["overview", "settings", "features", "notifications", "security", "revenue"] as Module[]).includes(active) && <DataModule active={active} rows={rows} columns={columns} total={total} page={page} size={size} search={search} setSearch={setSearch} status={status} setStatus={setStatus} setPage={setPage} actionFor={actionFor}/>} 
      </div>
    </section>
    {dialog && <AdminDialog dialog={dialog} busy={busy} close={() => setDialog(null)} rpc={rpc}/>} 
  </main>;
}

function Overview({ summary, analytics, days, setDays, navigate }: { summary: Row; analytics: Row[]; days: number; setDays: (n: number) => void; navigate: (m: Module) => void }) {
  const cards = [["Utilisateurs", summary.users_total ?? 0, "Total", "users"], ["Transactions", summary.transactions_total ?? 0, "Total", "transactions"], ["Volume", money(summary.transactions_volume_total), "XOF", "revenue"], ["Commissions", money(summary.commission_revenue_total), "Revenus", "revenue"], ["Dépôts", money(summary.deposits_volume_successful), "Réussis", "deposits"], ["Retraits", money(summary.withdrawals_volume_successful), "Réussis", "withdrawals"], ["Litiges", summary.disputes_open ?? 0, "Ouverts", "disputes"], ["Support", summary.support_tickets_open ?? 0, "Tickets ouverts", "support"]];
  return <div className="adm-overview"><section className="adm-hero"><div><span>TABLEAU DE BORD</span><h2>Bonjour, administrateur.</h2><p>Une vue unifiée des opérations SafePay, alimentée par le backend réel.</p></div><div className="adm-hero-status"><i/> Système opérationnel</div></section><section className="adm-kpis">{cards.map(([label, val, sub, target]: any) => <button key={label} className="adm-kpi" onClick={() => navigate(target)}><div className="adm-kpi-top"><span>{label}</span><Icon name={target}/></div><strong>{typeof val === "number" ? val.toLocaleString("fr-FR") : val}</strong><small>{sub}</small><em><Icon name="arrow" size={14}/></em></button>)}</section><section className="adm-grid-two"><div className="adm-panel adm-chart"><div className="adm-panel-head"><div><span>ACTIVITÉ</span><h3>Volume des transactions</h3></div><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={365}>12 mois</option></select></div><MiniChart data={analytics}/></div><div className="adm-panel"><div className="adm-panel-head"><div><span>SURVEILLANCE</span><h3>Indicateurs SafePay</h3></div></div><Health summary={summary}/></div></section><section className="adm-panel"><div className="adm-panel-head"><div><span>ACCÈS RAPIDE</span><h3>Actions opérationnelles</h3></div></div><div className="adm-quick">{[["kyc","KYC","Vérifier les dossiers"],["withdrawals","Retraits","Traiter les payouts"],["disputes","Litiges","Gérer l'escrow"],["support","Support","Répondre aux clients"],["settings","Paramètres","Modifier les règles"],["audit","Audit logs","Tracer les actions"]].map(([k,l,d]) => <button key={k} onClick={() => navigate(k as Module)}><Icon name={k}/><div><b>{l}</b><small>{d}</small></div><Icon name="arrow" size={15}/></button>)}</div></section></div>;
}

function Health({ summary }: { summary: Row }) { const items = [["Wallet & Ledger", `${money(summary.wallets_total_balance)} disponibles`], ["Fonds bloqués", money(summary.wallets_total_locked)], ["Retraits en attente", String(summary.withdrawals_pending_count ?? 0)], ["Dépôts en attente", String(summary.deposits_pending_count ?? 0)]]; return <div className="adm-health">{items.map(([a,b]) => <div key={a}><span><i/>{a}</span><b>{b}</b></div>)}</div>; }
function MiniChart({ data }: { data: Row[] }) { const max = Math.max(1, ...data.map((x) => Number(x.transaction_volume ?? 0))); if (!data.length) return <div className="adm-empty-chart">Aucune donnée pour la période sélectionnée.</div>; return <div className="adm-bars">{data.map((x) => { const n = Number(x.transaction_volume ?? 0); return <div className="adm-bar-col" key={String(x.date)}><div className="adm-bar" style={{ height: `${Math.max(5, n / max * 100)}%` }} title={money(n)}/><small>{String(x.date).slice(5)}</small></div>; })}</div>; }

function DataModule({ active, rows, columns, total, page, size, search, setSearch, status, setStatus, setPage, actionFor }: any) {
  const statusOptions = active === "support" ? ["open", "in_progress", "resolved", "closed"] : active === "withdrawals" ? ["pending", "processing", "completed", "failed", "cancelled"] : ["pending", "processing", "funded", "delivered", "completed", "disputed", "cancelled", "resolved", "approved", "rejected"];
  return <section className="adm-data"><div className="adm-module-intro"><div><span>DONNÉES RÉELLES</span><h2>{modules.find((m) => m[0] === active)?.[1]}</h2><p>Lecture contrôlée par les RPC administratives SafePay. Les opérations financières ne sont jamais exécutées directement depuis le navigateur.</p></div><div className="adm-readonly"><Icon name="security"/> Backend source of truth</div></div><div className="adm-data-toolbar"><div className="adm-search"><Icon name="search" size={17}/><input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder={`Rechercher dans ${labelize(active)}…`}/></div>{["transactions","deposits","withdrawals","disputes","support","kyc"].includes(active) && <select value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }}><option value="">Tous les statuts</option>{statusOptions.map((x: string) => <option key={x} value={x}>{x}</option>)}</select>}<span className="adm-count">{total.toLocaleString("fr-FR")} enregistrements</span></div><div className="adm-panel adm-table-panel"><div className="adm-table-wrap"><table><thead><tr>{columns.map((c: string) => <th key={c}>{labelize(c)}</th>)}<th className="action-col">Actions</th></tr></thead><tbody>{rows.length ? rows.map((r: Row, i: number) => <tr key={String(r.id ?? r.user_id ?? i)}>{columns.map((c: string) => <td key={c}><Cell value={r[c]} keyName={c}/></td>)}<td className="action-col">{actionFor(r)}</td></tr>) : <tr><td colSpan={columns.length + 1}><div className="adm-empty"><div><Icon name="search" size={22}/></div><b>Aucune donnée trouvée</b><span>Essayez une autre recherche ou un autre filtre.</span></div></td></tr>}</tbody></table></div><div className="adm-pagination"><span>Page {page + 1} · {rows.length} affichés</span><div><button disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button><button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)}>Suivant</button></div></div></div></section>;
}
function Cell({ value, keyName }: { value: any; keyName: string }) { if (value === null || value === undefined || value === "") return <span className="muted">—</span>; if (typeof value === "boolean") return <span className={`adm-badge ${value ? "success" : "neutral"}`}>{value ? "Oui" : "Non"}</span>; if (isMoney(keyName)) return <strong className="money">{money(value)}</strong>; if (isDate(keyName)) return <span>{date(value)}</span>; const text = display(value); const statusWords = ["pending", "processing", "completed", "approved", "rejected", "disputed", "cancelled", "resolved", "active", "inactive", "funded", "delivered", "open", "in_progress", "closed", "failed"]; if (statusWords.includes(String(value).toLowerCase())) return <span className={`adm-badge ${String(value).toLowerCase()}`}>{String(value).replaceAll("_", " ")}</span>; return <span title={text}>{text.length > 48 ? `${text.slice(0, 48)}…` : text}</span>; }

function Settings({ settings, setSettings, busy, rpc }: { settings: Setting[]; setSettings: (s: Setting[]) => void; busy: boolean; rpc: (name: string, args: any) => Promise<boolean> }) { return <section className="adm-settings"><div className="adm-section-intro"><div><span>RÈGLES MÉTIER</span><h2>Paramètres SafePay</h2><p>Ces valeurs sont stockées dans <b>app_settings</b> et contrôlent les règles autorisées par le backend.</p></div><div className="adm-lock"><Icon name="security"/> Synchronisé backend</div></div><div className="adm-settings-grid">{settings.map((s) => <div className="adm-setting" key={s.key}><div><span>{s.label}</span><p>{s.description}<small>{s.key}</small></p></div>{s.type === "boolean" ? <button className={`adm-switch ${s.value ? "on" : ""}`} disabled={busy} onClick={() => { const value = !Boolean(s.value); setSettings(settings.map((x) => x.key === s.key ? { ...x, value } : x)); rpc("admin_set_app_setting", { p_key: s.key, p_value_numeric: null, p_value_text: null, p_value_boolean: value, p_reason: "Modification depuis le Dashboard Admin" }); }}><i/></button> : <div className="adm-number"><input type="number" value={Number(s.value)} min={0} max={s.unit === "%" ? 100 : undefined} disabled={busy} onChange={(e) => setSettings(settings.map((x) => x.key === s.key ? { ...x, value: Number(e.target.value) } : x))}/><span>{s.unit}</span><button disabled={busy} onClick={() => rpc("admin_set_app_setting", { p_key: s.key, p_value_numeric: Number(s.value), p_value_text: null, p_value_boolean: null, p_reason: "Modification depuis le Dashboard Admin" })}>Enregistrer</button></div>}</div>)}</div></section>; }
function Features({ flags, setFlags, busy, rpc }: { flags: Record<string, boolean>; setFlags: (f: Record<string, boolean>) => void; busy: boolean; rpc: (name: string, args: any) => Promise<boolean> }) { const keys = ["new_signups_enabled", "deposits_enabled", "withdrawals_enabled", "card_payments_enabled", "disputes_enabled"]; return <section className="adm-settings"><div className="adm-section-intro"><div><span>FEATURE FLAGS</span><h2>Contrôle des fonctionnalités</h2><p>Ces interrupteurs écrivent dans <b>feature_flags</b> via <b>admin_set_feature_flag</b>.</p></div></div><div className="adm-settings-grid">{keys.map((key) => { const on = Boolean(flags[key]); return <div className="adm-setting" key={key}><div><span>{labelize(key)}</span><p>{key === "card_payments_enabled" ? "Paiements par carte bancaire." : key === "new_signups_enabled" ? "Autoriser les nouvelles inscriptions." : key === "deposits_enabled" ? "Autoriser les recharges de wallet." : key === "withdrawals_enabled" ? "Autoriser les retraits." : "Autoriser l'ouverture de nouveaux litiges."}</p></div><button className={`adm-switch ${on ? "on" : ""}`} disabled={busy} onClick={() => { const value = !on; setFlags({ ...flags, [key]: value }); rpc("admin_set_feature_flag", { p_key: key, p_enabled: value, p_reason: "Modification depuis le Dashboard Admin" }); }}><i/></button></div>; })}</div></section>; }
function NotificationCenter({ busy, rpc }: { busy: boolean; rpc: (name: string, args: any) => Promise<boolean> }) { const [user, setUser] = useState(""); const [title, setTitle] = useState(""); const [message, setMessage] = useState(""); return <section className="adm-form-panel"><div className="adm-section-intro"><div><span>COMMUNICATION</span><h2>Envoyer une notification</h2><p>La notification est créée via <b>admin_send_notification</b> et la table <b>notifications</b>.</p></div></div><div className="adm-form-grid"><label>Utilisateur ID<input value={user} onChange={(e) => setUser(e.target.value)} placeholder="UUID du profil"/></label><label>Titre<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Confirmation de transaction"/></label><label className="full">Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message…"/></label></div><button className="adm-primary" disabled={busy || !user || !title || !message} onClick={() => rpc("admin_send_notification", { p_user_id: user, p_title: title, p_message: message })}>Envoyer la notification <Icon name="arrow" size={16}/></button></section>; }
function SecurityCenter() { const checks = [["RLS Supabase", "Contrôle backend"], ["Admin gate", "is_admin()"], ["Audit logs", "Traçabilité des actions"], ["Secrets frontend", "Aucune clé service-role"], ["Wallet source of truth", "Supabase"], ["OTP", "Mode test configuré"]]; return <section className="adm-settings"><div className="adm-section-intro"><div><span>SÉCURITÉ</span><h2>Architecture de contrôle</h2><p>Cette page décrit les garde-fous SafePay. Elle ne remplace pas un audit de sécurité.</p></div><div className="adm-lock"><Icon name="security"/> Contrôlé par backend</div></div><div className="adm-security-grid">{checks.map(([a,b]) => <div key={a}><div className="adm-security-icon"><Icon name="security"/></div><div><b>{a}</b><small>{b}</small></div><span className="adm-badge success">EN PLACE</span></div>)}</div></section>; }
function Revenue({ analytics, days, setDays }: { analytics: Row[]; days: number; setDays: (n: number) => void }) { const total = analytics.reduce((s, x) => s + Number(x.transaction_volume ?? 0), 0); const fees = analytics.reduce((s, x) => s + Number(x.revenue ?? 0), 0); const deposits = analytics.reduce((s, x) => s + Number(x.deposits ?? 0), 0); const withdrawals = analytics.reduce((s, x) => s + Number(x.withdrawals ?? 0), 0); return <section className="adm-overview"><div className="adm-section-intro"><div><span>PLATFORM FEES</span><h2>Revenus SafePay</h2><p>Les données proviennent de <b>admin_analytics_timeseries</b>, alimentée par transactions, platform_fees, deposits et withdrawals.</p></div><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={365}>12 mois</option></select></div><div className="adm-kpis adm-kpis-three"><div className="adm-kpi static"><div className="adm-kpi-top"><span>Volume</span><Icon name="revenue"/></div><strong>{money(total)}</strong><small>Transactions terminées</small></div><div className="adm-kpi static"><div className="adm-kpi-top"><span>Revenus plateforme</span><Icon name="revenue"/></div><strong>{money(fees)}</strong><small>Platform fees</small></div><div className="adm-kpi static"><div className="adm-kpi-top"><span>Flux</span><Icon name="transactions"/></div><strong>{money(deposits + withdrawals)}</strong><small>Dépôts + retraits</small></div></div><div className="adm-panel adm-chart"><div className="adm-panel-head"><div><span>ÉVOLUTION</span><h3>Volume transactionnel</h3></div></div><MiniChart data={analytics}/></div></section>; }

function AdminDialog({ dialog, close, busy, rpc }: { dialog: Exclude<Dialog, null>; close: () => void; busy: boolean; rpc: (name: string, args: any) => Promise<boolean> }) {
  const [text, setText] = useState(""); const [choice, setChoice] = useState(dialog.kind === "withdrawal" ? "processing" : "refund_buyer"); const r = dialog.row ?? {};
  async function run() {
    let ok = false;
    if (dialog.kind === "notify") ok = await rpc("admin_send_notification", { p_user_id: r.id, p_title: "Message SafePay", p_message: text });
    if (dialog.kind === "support") ok = await rpc("admin_send_support_message", { p_ticket_id: r.id, p_message: text });
    if (dialog.kind === "kyc") ok = await rpc("admin_review_kyc", { p_user_id: r.id, p_approve: choice === "approve", p_reason: text || (choice === "approve" ? "KYC approuvé par l'administrateur" : "KYC rejeté par l'administrateur") });
    if (dialog.kind === "withdrawal") ok = await rpc("admin_update_withdrawal_status", { p_withdrawal_id: r.id, p_status: choice, p_reason: text || "Mise à jour depuis le Dashboard Admin" });
    if (dialog.kind === "dispute") ok = await rpc("admin_resolve_dispute", { p_dispute_id: r.id, p_resolution: text, p_resolution_action: choice });
    if (dialog.kind === "admin") ok = await rpc("admin_manage_admin_users", { p_target_user_id: r.user_id, p_action: "remove", p_role: r.role || "admin", p_reason: text });
    if (ok) close();
  }
  const titles: Record<string,string> = { notify: "Notifier l'utilisateur", support: "Répondre au ticket", kyc: "Décision KYC", withdrawal: "Traitement du retrait", dispute: "Résolution du litige", admin: "Retirer l'administrateur" };
  return <div className="adm-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><div className="adm-modal"><div className="adm-modal-head"><div><span>ACTION SÉCURISÉE</span><h3>{titles[dialog.kind]}</h3></div><button onClick={close}><Icon name="close"/></button></div><div className="adm-modal-body"><div className="adm-modal-context"><b>{r.full_name || r.name || r.phone || r.id || r.user_id}</b><small>{r.phone || r.status || "Action administrateur"}</small></div>{dialog.kind === "kyc" && <div className="adm-choice"><button className={choice === "approve" ? "selected" : ""} onClick={() => setChoice("approve")}>Approuver</button><button className={choice === "reject" ? "selected danger" : ""} onClick={() => setChoice("reject")}>Refuser</button></div>}{dialog.kind === "withdrawal" && <label className="adm-modal-label">Nouveau statut<select value={choice} onChange={(e) => setChoice(e.target.value)}><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></label>}{dialog.kind === "dispute" && <label className="adm-modal-label">Décision<select value={choice} onChange={(e) => setChoice(e.target.value)}><option value="refund_buyer">Rembourser l'acheteur</option><option value="release_seller">Libérer au vendeur</option><option value="partial_refund">Remboursement partiel</option><option value="close_no_action">Clôturer sans action</option></select></label>}{dialog.kind !== "withdrawal" && <label className="adm-modal-label">{dialog.kind === "kyc" ? "Motif" : dialog.kind === "admin" ? "Motif du retrait" : "Message / justification"}<textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Saisissez la justification…"/></label>}{dialog.kind === "withdrawal" && <label className="adm-modal-label">Motif<textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Motif de la mise à jour…"/></label>}</div><div className="adm-modal-foot"><button className="ghost" onClick={close}>Annuler</button><button className="adm-primary" disabled={busy || (dialog.kind === "dispute" && !text) || (dialog.kind === "notify" && !text) || (dialog.kind === "support" && !text)} onClick={run}>{busy ? "Traitement…" : "Confirmer"}</button></div></div></div>;
}
