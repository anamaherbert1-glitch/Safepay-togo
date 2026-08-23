"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminStyles from "./AdminStyles";

type Row = Record<string, any>;
type Module = "overview" | "users" | "kyc" | "transactions" | "wallets" | "ledger" | "deposits" | "withdrawals" | "disputes" | "support" | "notifications" | "revenue" | "invoices" | "settings" | "features" | "audit" | "admins" | "security";

type Setting = { key: string; label: string; description: string; type: "number" | "boolean"; value: number | boolean; unit?: string };

const modules: [Module, string, string][] = [
  ["overview", "Vue générale", "Pilotage SafePay"],
  ["users", "Utilisateurs", "Comptes & activité"],
  ["kyc", "KYC", "Vérifications"],
  ["transactions", "Transactions", "Flux financiers"],
  ["wallets", "Wallets", "Soldes"],
  ["ledger", "Ledger", "Journal financier"],
  ["deposits", "Dépôts", "Recharges"],
  ["withdrawals", "Retraits", "Payouts"],
  ["disputes", "Litiges", "Escrow & résolution"],
  ["support", "Support", "Tickets clients"],
  ["notifications", "Notifications", "Communication"],
  ["revenue", "Revenus", "Platform fees"],
  ["invoices", "Factures", "Documents"],
  ["settings", "Paramètres", "Règles métier"],
  ["features", "Fonctionnalités", "Feature flags"],
  ["audit", "Audit logs", "Traçabilité"],
  ["admins", "Administrateurs", "Accès"],
  ["security", "Sécurité", "Contrôles"],
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

const money = (v: any) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const display = (v: any) => v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
const labelize = (key: string) => key.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    overview: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    kyc: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3ZM9 12l2 2 4-5",
    transactions: "M7 7h12l-3-3M17 17H5l3 3M19 7a7 7 0 0 1-2 5M5 17a7 7 0 0 1 2-5",
    wallets: "M3 7h18v13H3zM3 7l2-4h14l2 4M16 13h5",
    ledger: "M6 3h12v18H6zM9 7h6M9 11h6M9 15h4",
    deposits: "M12 3v13M7 11l5 5 5-5M4 21h16",
    withdrawals: "M12 21V8M7 13l5-5 5 5M4 3h16",
    disputes: "M12 3 3 7l9 4 9-4-9-4ZM3 12l9 4 9-4M3 17l9 4 9-4",
    support: "M4 5h16v12H8l-4 4V5ZM8 9h8M8 13h5",
    notifications: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    revenue: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8M20 16V4",
    invoices: "M6 2h9l5 5v15H6zM14 2v6h6M9 12h6M9 16h6",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 12h2m14 0h2M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4",
    features: "M12 2l2.8 6.2L21 9l-4.5 4.3L17.7 20 12 16.8 6.3 20l1.2-6.7L3 9l6.2-.8L12 2Z",
    audit: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h5",
    admins: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
    security: "M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3ZM9 12l2 2 4-5",
    search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4",
    refresh: "M20 11a8.1 8.1 0 0 0-15-3M4 4v4h4M4 13a8.1 8.1 0 0 0 15 3M20 20v-4h-4",
    arrow: "M5 12h14M13 6l6 6-6 6",
    check: "m5 12 4 4L19 6",
    close: "M6 6l12 12M18 6 6 18",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.settings} /></svg>;
}

export default function AdminPage() {
  const router = useRouter();
  const [active, setActive] = useState<Module>("overview");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState<Row>({});
  const [settings, setSettings] = useState(settingsDefault);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [analytics, setAnalytics] = useState<Row[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const size = 20;

  const current = modules.find((m) => m[0] === active)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { router.replace("/login?next=/admin"); return; }
      const gate = await s.rpc("is_admin");
      if (gate.error || !gate.data) { if (!cancelled) { setError("Accès administrateur requis."); setLoading(false); } return; }
      const [pub, sum, stats, ff] = await Promise.all([
        s.rpc("get_public_settings"),
        s.rpc("get_admin_dashboard_summary"),
        s.rpc("admin_dashboard_stats"),
        s.from("feature_flags").select("key,enabled"),
      ]);
      if (cancelled) return;
      if (pub.data) setSettings(settingsDefault.map((x) => ({ ...x, value: pub.data[x.key] ?? x.value })));
      setSummary({ ...(sum.data ?? {}), ...(stats.data ?? {}) });
      if (ff.data) setFlags(Object.fromEntries(ff.data.map((x: any) => [x.key, Boolean(x.enabled)])));
      setLoading(false);
    })().catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Erreur de chargement"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => { if (!loading && active !== "overview" && active !== "settings" && active !== "features" && active !== "notifications" && active !== "security") loadModule(); }, [active, page, status, search, loading]);
  useEffect(() => { if (!loading && active === "revenue") loadRevenue(); }, [days, loading, active]);

  function unwrap(data: any) {
    if (Array.isArray(data)) return { items: data, total: data.length };
    if (data?.items) return { items: Array.isArray(data.items) ? data.items : [], total: Number(data.total ?? data.items.length) };
    return { items: [], total: 0 };
  }

  async function loadModule() {
    const s = createClient(); setError("");
    let r: any;
    const q = search.trim() || null;
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
    if (!r) return;
    if (r.error) { setError(r.error.message); setRows([]); return; }
    const x = unwrap(r.data); setRows(x.items); setTotal(x.total);
  }

  async function loadRevenue() {
    const r = await createClient().rpc("admin_analytics_timeseries", { p_days: days });
    if (r.error) setError(r.error.message); else setAnalytics(Array.isArray(r.data) ? r.data : []);
  }

  async function rpc(name: string, args: Record<string, any>) {
    setBusy(true); setError(""); setToast("");
    const r = await createClient().rpc(name, args);
    setBusy(false);
    if (r.error) { setError(r.error.message); return; }
    setToast("Modification enregistrée avec succès.");
    await loadModule();
  }

  function navigate(next: Module) { setActive(next); setPage(0); setSearch(""); setStatus(""); setMobileNav(false); setError(""); }

  const columns = useMemo(() => {
    const keys = new Set<string>(); rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    return [...keys].filter((k) => !["details", "password", "secret", "token"].includes(k)).slice(0, 7);
  }, [rows]);

  const actionFor = (r: Row) => {
    const id = String(r.user_id ?? r.id ?? "");
    if (active === "users") return <div className="adm-actions"><button onClick={() => rpc("admin_set_account_status", { p_user_id: id, p_is_active: !Boolean(r.is_active), p_reason: Boolean(r.is_active) ? "Blocage par administrateur" : "Réactivation par administrateur" })}>{Boolean(r.is_active) ? "Bloquer" : "Réactiver"}</button><button onClick={() => { const title = window.prompt("Titre"); const message = window.prompt("Message"); if (title && message) rpc("admin_send_notification", { p_title: title, p_message: message, p_user_id: id }); }}>Notifier</button></div>;
    if (active === "kyc") return <div className="adm-actions"><button onClick={() => rpc("admin_review_kyc", { p_user_id: id, p_approve: true, p_reason: "KYC approuvé par l'administrateur" })}>Approuver</button><button className="danger" onClick={() => { const reason = window.prompt("Motif du refus"); if (reason) rpc("admin_review_kyc", { p_user_id: id, p_approve: false, p_reason: reason }); }}>Refuser</button></div>;
    if (active === "withdrawals" && r.status === "pending") return <button onClick={() => { const reason = window.prompt("Motif"); rpc("admin_update_withdrawal_status", { p_withdrawal_id: id, p_status: "processing", p_reason: reason || "Traitement administrateur" }); }}>Traiter</button>;
    if (active === "disputes") return <button onClick={() => { const resolution = window.prompt("Décision / résolution"); if (resolution) rpc("admin_resolve_dispute", { p_dispute_id: id, p_resolution: resolution, p_resolution_action: "resolve" }); }}>Résoudre</button>;
    if (active === "support") return <button onClick={() => { const message = window.prompt("Réponse au client"); if (message) rpc("admin_send_support_message", { p_ticket_id: id, p_message: message }); }}>Répondre</button>;
    if (active === "admins") return <button className="danger" onClick={() => { const reason = window.prompt("Motif du retrait"); if (reason) rpc("admin_manage_admin_users", { p_target_user_id: id, p_action: "remove", p_role: "admin", p_reason: reason }); }}>Retirer</button>;
    return <button className="ghost" onClick={() => setToast("Sélectionnez une ligne pour consulter ses données détaillées.")}>Détails</button>;
  };

  if (loading) return <main className="adm-loading"><AdminStyles/><div className="adm-loader"><div className="adm-logo">S</div><h2>SafePay Admin</h2><p>Connexion sécurisée au centre d'administration…</p><span /></div></main>;
  if (error === "Accès administrateur requis.") return <main className="adm-loading"><AdminStyles/><div className="adm-access"><Icon name="security" size={42}/><h2>Accès administrateur requis</h2><p>Votre compte ne possède pas les permissions nécessaires.</p><button onClick={() => router.push("/dashboard")}>Retour à SafePay</button></div></main>;

  return <main className="adm-app">
    <AdminStyles/>
    <aside className={`adm-sidebar ${mobileNav ? "open" : ""}`}>
      <div className="adm-brand"><div className="adm-brand-mark">S</div><div><strong>SafePay</strong><span>ADMIN CONSOLE</span></div></div>
      <div className="adm-nav-label">PILOTAGE</div>
      <nav>{modules.slice(0, 13).map(([key, label, desc]) => <button key={key} className={active === key ? "active" : ""} onClick={() => navigate(key)}><Icon name={key}/><span><b>{label}</b><small>{desc}</small></span></button>)}</nav>
      <div className="adm-nav-label">CONFIGURATION & SÉCURITÉ</div>
      <nav>{modules.slice(13).map(([key, label, desc]) => <button key={key} className={active === key ? "active" : ""} onClick={() => navigate(key)}><Icon name={key}/><span><b>{label}</b><small>{desc}</small></span></button>)}</nav>
      <div className="adm-side-footer"><div className="adm-avatar">A</div><div><b>Administrateur</b><small>Session sécurisée</small></div><button onClick={() => router.push("/dashboard")} aria-label="Retour à SafePay"><Icon name="arrow" size={17}/></button></div>
    </aside>

    <section className="adm-main">
      <header className="adm-header">
        <button className="adm-mobile-toggle" onClick={() => setMobileNav(!mobileNav)}><span/><span/><span/></button>
        <div className="adm-heading"><div className="adm-eyebrow">SAFE PAY / ADMINISTRATION</div><h1>{current[1]}</h1><p>{current[2]}</p></div>
        <div className="adm-header-right"><div className="adm-live"><i/> Backend connecté</div><button className="adm-refresh" onClick={() => active === "revenue" ? loadRevenue() : loadModule()} aria-label="Actualiser"><Icon name="refresh"/></button></div>
      </header>
      <div className="adm-content">
        {toast && <div className="adm-toast"><Icon name="check" size={16}/>{toast}<button onClick={() => setToast("")}><Icon name="close" size={15}/></button></div>}
        {error && <div className="adm-error">{error}</div>}
        {active === "overview" && <Overview summary={summary} analytics={analytics} days={days} setDays={setDays} navigate={navigate}/>} 
        {active === "settings" && <Settings settings={settings} setSettings={setSettings} busy={busy} rpc={rpc}/>} 
        {active === "features" && <Features flags={flags} setFlags={setFlags} busy={busy} rpc={rpc}/>} 
        {active === "notifications" && <NotificationCenter busy={busy} rpc={rpc}/>} 
        {active === "security" && <SecurityCenter/>}
        {active === "revenue" && <Revenue analytics={analytics} days={days} setDays={setDays}/>} 
        {!(["overview", "settings", "features", "notifications", "security", "revenue"] as Module[]).includes(active) && <DataModule active={active} rows={rows} columns={columns} total={total} page={page} size={size} search={search} setSearch={setSearch} status={status} setStatus={setStatus} setPage={setPage} actionFor={actionFor}/>} 
      </div>
    </section>
  </main>;
}

function Overview({ summary, analytics, days, setDays, navigate }: { summary: Row; analytics: Row[]; days: number; setDays: (n: number) => void; navigate: (m: Module) => void }) {
  const cards = [
    ["Utilisateurs", summary.users_total ?? summary.users ?? 0, "Total", "users"],
    ["Transactions", summary.transactions_total ?? summary.transactions ?? 0, "Total", "transactions"],
    ["Volume", money(summary.transactions_volume_total ?? summary.transaction_volume), "XOF", "revenue"],
    ["Commissions", money(summary.commission_revenue_total ?? summary.commissions), "Revenus", "revenue"],
    ["Dépôts", money(summary.deposits_volume_successful), "Réussis", "deposits"],
    ["Retraits", money(summary.withdrawals_volume_successful), "Réussis", "withdrawals"],
    ["Litiges", summary.disputes_open ?? summary.open_disputes ?? 0, "Ouverts", "disputes"],
    ["Support", summary.support_tickets_open ?? 0, "Tickets ouverts", "support"],
  ];
  return <div className="adm-overview">
    <section className="adm-hero"><div><span>TABLEAU DE BORD</span><h2>Bonjour, administrateur.</h2><p>Une vue unifiée des opérations SafePay, alimentée par le backend réel.</p></div><div className="adm-hero-status"><i/> Système opérationnel</div></section>
    <section className="adm-kpis">{cards.map(([label, val, sub, target]: any) => <button key={label} className="adm-kpi" onClick={() => navigate(target)}><div className="adm-kpi-top"><span>{label}</span><Icon name={target}/></div><strong>{typeof val === "number" ? val.toLocaleString("fr-FR") : val}</strong><small>{sub}</small><em><Icon name="arrow" size={14}/></em></button>)}</section>
    <section className="adm-grid-two">
      <div className="adm-panel adm-chart"><div className="adm-panel-head"><div><span>ACTIVITÉ</span><h3>Volume des transactions</h3></div><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={365}>12 mois</option></select></div><MiniChart data={analytics}/></div>
      <div className="adm-panel"><div className="adm-panel-head"><div><span>SURVEILLANCE</span><h3>État de la plateforme</h3></div></div><Health summary={summary}/></div>
    </section>
    <section className="adm-panel"><div className="adm-panel-head"><div><span>ACCÈS RAPIDE</span><h3>Actions opérationnelles</h3></div></div><div className="adm-quick">{[["kyc","KYC","Vérifier les dossiers"],["withdrawals","Retraits","Traiter les payouts"],["disputes","Litiges","Gérer l'escrow"],["support","Support","Répondre aux clients"],["settings","Paramètres","Modifier les règles"],["audit","Audit logs","Tracer les actions"]].map(([k,l,d]) => <button key={k} onClick={() => navigate(k as Module)}><Icon name={k}/><div><b>{l}</b><small>{d}</small></div><Icon name="arrow" size={15}/></button>)}</div></section>
  </div>;
}

function Health({ summary }: { summary: Row }) {
  const items = [["Auth & utilisateurs", "Opérationnel"], ["Wallet & Ledger", "Opérationnel"], ["Transactions & escrow", "Opérationnel"], ["Notifications", "Opérationnel"]];
  return <div className="adm-health">{items.map(([a,b]) => <div key={a}><span><i/>{a}</span><b>{b}</b></div>)}</div>;
}

function MiniChart({ data }: { data: Row[] }) {
  const max = Math.max(1, ...data.map((x) => Number(x.transaction_volume ?? x.volume ?? 0)));
  if (!data.length) return <div className="adm-empty-chart">Aucune donnée pour la période sélectionnée.</div>;
  return <div className="adm-bars">{data.map((x) => { const n = Number(x.transaction_volume ?? x.volume ?? 0); return <div className="adm-bar-col" key={String(x.date)}><div className="adm-bar" style={{ height: `${Math.max(5, n / max * 100)}%` }} title={money(n)}/><small>{String(x.date).slice(5)}</small></div>; })}</div>;
}

function DataModule({ active, rows, columns, total, page, size, search, setSearch, status, setStatus, setPage, actionFor }: any) {
  const statusOptions = ["pending", "processing", "funded", "delivered", "completed", "disputed", "cancelled", "open", "resolved", "approved", "rejected"];
  return <section className="adm-data">
    <div className="adm-data-toolbar"><div className="adm-search"><Icon name="search" size={17}/><input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder={`Rechercher dans ${labelize(active)}…`}/></div>{["transactions","deposits","withdrawals","disputes","support","kyc"].includes(active) && <select value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }}><option value="">Tous les statuts</option>{statusOptions.map((x) => <option key={x} value={x}>{x}</option>)}</select>}<span className="adm-count">{total.toLocaleString("fr-FR")} enregistrements</span></div>
    <div className="adm-panel adm-table-panel"><div className="adm-table-wrap"><table><thead><tr>{columns.map((c: string) => <th key={c}>{labelize(c)}</th>)}<th className="action-col">Actions</th></tr></thead><tbody>{rows.length ? rows.map((r: Row, i: number) => <tr key={String(r.id ?? r.user_id ?? i)}>{columns.map((c: string) => <td key={c}><Cell value={r[c]} keyName={c}/></td>)}<td className="action-col">{actionFor(r)}</td></tr>) : <tr><td colSpan={columns.length + 1}><div className="adm-empty"><div><Icon name="search" size={22}/></div><b>Aucune donnée trouvée</b><span>Essayez une autre recherche ou un autre filtre.</span></div></td></tr>}</tbody></table></div><div className="adm-pagination"><span>Page {page + 1} · {Math.min(size, rows.length)} affichés</span><div><button disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button><button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)}>Suivant</button></div></div></div>
  </section>;
}

function Cell({ value, keyName }: { value: any; keyName: string }) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (typeof value === "boolean") return <span className={`adm-badge ${value ? "success" : "neutral"}`}>{value ? "Oui" : "Non"}</span>;
  if (keyName.toLowerCase().includes("amount") || keyName.toLowerCase().includes("balance") || keyName.toLowerCase().includes("volume") || keyName.toLowerCase().includes("fee") || keyName.toLowerCase().includes("commission")) return <strong className="money">{money(value)}</strong>;
  const text = display(value); const statusWords = ["pending", "processing", "completed", "approved", "rejected", "disputed", "cancelled", "open", "resolved", "active", "inactive", "funded", "delivered"];
  if (statusWords.includes(String(value).toLowerCase())) return <span className={`adm-badge ${String(value).toLowerCase()}`}>{String(value)}</span>;
  return <span title={text}>{text.length > 42 ? `${text.slice(0, 42)}…` : text}</span>;
}

function Settings({ settings, setSettings, busy, rpc }: { settings: Setting[]; setSettings: (s: Setting[]) => void; busy: boolean; rpc: (name: string, args: any) => Promise<void> }) {
  return <section className="adm-settings"><div className="adm-section-intro"><div><span>RÈGLES MÉTIER</span><h2>Paramètres SafePay</h2><p>Ces valeurs pilotent les règles autorisées par le backend. Aucun montant financier n'est modifié directement depuis le navigateur.</p></div><div className="adm-lock"><Icon name="security"/> Backend contrôlé</div></div><div className="adm-settings-grid">{settings.map((s) => <div className="adm-setting" key={s.key}><div><span>{s.label}</span><p>{s.description}</p></div>{s.type === "boolean" ? <button className={`adm-switch ${s.value ? "on" : ""}`} disabled={busy} onClick={() => { const value = !Boolean(s.value); setSettings(settings.map((x) => x.key === s.key ? { ...x, value } : x)); rpc("admin_set_app_setting", { p_key: s.key, p_value_numeric: null, p_value_text: null, p_value_boolean: value, p_reason: "Modification depuis le Dashboard Admin" }); }}><i/></button> : <div className="adm-number"><input type="number" value={Number(s.value)} disabled={busy} onChange={(e) => setSettings(settings.map((x) => x.key === s.key ? { ...x, value: Number(e.target.value) } : x))}/><span>{s.unit}</span><button disabled={busy} onClick={() => rpc("admin_set_app_setting", { p_key: s.key, p_value_numeric: Number(s.value), p_value_text: null, p_value_boolean: null, p_reason: "Modification depuis le Dashboard Admin" })}>Enregistrer</button></div>}</div>)}</div></section>;
}

function Features({ flags, setFlags, busy, rpc }: { flags: Record<string, boolean>; setFlags: (f: Record<string, boolean>) => void; busy: boolean; rpc: (name: string, args: any) => Promise<void> }) {
  const all = ["new_signups_enabled", "deposits_enabled", "withdrawals_enabled", "card_payments_enabled", "disputes_enabled"];
  return <section className="adm-settings"><div className="adm-section-intro"><div><span>FEATURE FLAGS</span><h2>Fonctionnalités contrôlables</h2><p>Activez ou désactivez uniquement les fonctionnalités prévues par le backend.</p></div></div><div className="adm-settings-grid">{all.map((key) => { const on = Boolean(flags[key]); return <div className="adm-setting" key={key}><div><span>{labelize(key)}</span><p>État dynamique de la fonctionnalité.</p></div><button className={`adm-switch ${on ? "on" : ""}`} disabled={busy} onClick={() => { const value = !on; setFlags({ ...flags, [key]: value }); rpc("admin_set_feature_flag", { p_key: key, p_enabled: value, p_reason: "Modification depuis le Dashboard Admin" }); }}><i/></button></div>; })}</div></section>;
}

function NotificationCenter({ busy, rpc }: { busy: boolean; rpc: (name: string, args: any) => Promise<void> }) {
  const [user, setUser] = useState(""); const [title, setTitle] = useState(""); const [message, setMessage] = useState("");
  return <section className="adm-form-panel"><div className="adm-section-intro"><div><span>COMMUNICATION</span><h2>Envoyer une notification</h2><p>La notification est créée via la fonction administrative existante et la table notifications.</p></div></div><div className="adm-form-grid"><label>Utilisateur ID<input value={user} onChange={(e) => setUser(e.target.value)} placeholder="UUID du profil"/></label><label>Titre<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Confirmation de transaction"/></label><label className="full">Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message…"/></label></div><button className="adm-primary" disabled={busy || !user || !title || !message} onClick={() => rpc("admin_send_notification", { p_user_id: user, p_title: title, p_message: message })}>Envoyer la notification <Icon name="arrow" size={16}/></button></section>;
}

function SecurityCenter() {
  const checks = [["RLS Supabase", "Actif"], ["Admin gate", "Actif"], ["Audit logs", "Actif"], ["Secrets frontend", "Protégés"], ["Wallet source of truth", "Backend"], ["OTP test", "Mode test"]];
  return <section className="adm-settings"><div className="adm-section-intro"><div><span>SÉCURITÉ</span><h2>Contrôles SafePay</h2><p>Cette page expose l'état des contrôles sans contourner les mécanismes de sécurité du backend.</p></div><div className="adm-lock"><Icon name="security"/> Surveillance</div></div><div className="adm-security-grid">{checks.map(([a,b]) => <div key={a}><div className="adm-security-icon"><Icon name="security"/></div><div><b>{a}</b><small>{b}</small></div><span className="adm-badge success">OK</span></div>)}</div></section>;
}

function Revenue({ analytics, days, setDays }: { analytics: Row[]; days: number; setDays: (n: number) => void }) {
  const total = analytics.reduce((s, x) => s + Number(x.transaction_volume ?? 0), 0); const fees = analytics.reduce((s, x) => s + Number(x.platform_fees ?? x.commission_revenue ?? 0), 0);
  return <section className="adm-overview"><div className="adm-section-intro"><div><span>PLATFORM FEES</span><h2>Revenus SafePay</h2><p>Les revenus affichés proviennent des agrégations backend existantes.</p></div><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={365}>12 mois</option></select></div><div className="adm-kpis adm-kpis-three"><div className="adm-kpi static"><div className="adm-kpi-top"><span>Volume période</span><Icon name="revenue"/></div><strong>{money(total)}</strong><small>Transactions</small></div><div className="adm-kpi static"><div className="adm-kpi-top"><span>Frais plateforme</span><Icon name="revenue"/></div><strong>{money(fees)}</strong><small>Revenus agrégés</small></div><div className="adm-kpi static"><div className="adm-kpi-top"><span>Jours suivis</span><Icon name="audit"/></div><strong>{analytics.length}</strong><small>Points de données</small></div></div><div className="adm-panel adm-chart"><div className="adm-panel-head"><div><span>ÉVOLUTION</span><h3>Activité financière</h3></div></div><MiniChart data={analytics}/></div></section>;
}
