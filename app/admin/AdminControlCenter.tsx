"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "analytics" | "language" | "theme" | "currency" | "admins" | "settings";
type AdminRow = Record<string, any>;
type Setting = { key: string; value: any };

const tabs: Array<[Tab, string]> = [
  ["analytics", "Analytique"],
  ["language", "Langue"],
  ["theme", "Thème"],
  ["currency", "Devise"],
  ["admins", "Administrateurs"],
  ["settings", "Paramètres SafePay"],
];

const money = (value: any, currency = "XOF") => {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(currency === "XOF" ? "fr-FR" : "en-US", { style: "currency", currency, maximumFractionDigits: currency === "XOF" ? 0 : 2 }).format(n);
  } catch { return `${n.toLocaleString()} ${currency}`; }
};

export default function AdminControlCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("fr");
  const [currency, setCurrency] = useState("XOF");
  const [analytics, setAnalytics] = useState<AdminRow[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [period, setPeriod] = useState("30");
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [role, setRole] = useState("admin");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("safepay-admin-theme") || "system";
    const savedLanguage = localStorage.getItem("safepay-admin-language") || "fr";
    const savedCurrency = localStorage.getItem("safepay-admin-currency") || "XOF";
    setTheme(savedTheme); setLanguage(savedLanguage); setCurrency(savedCurrency);
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (tab === "analytics") loadAnalytics();
    if (tab === "admins") loadAdmins();
    if (tab === "settings") loadSettings();
  }, [open, tab, period]);

  function applyTheme(value: string) {
    document.documentElement.dataset.adminTheme = value;
    if (value === "system") {
      document.documentElement.dataset.adminThemeResolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else document.documentElement.dataset.adminThemeResolved = value;
  }

  function chooseTheme(value: string) { setTheme(value); localStorage.setItem("safepay-admin-theme", value); applyTheme(value); }
  function chooseLanguage(value: string) { setLanguage(value); localStorage.setItem("safepay-admin-language", value); }
  function chooseCurrency(value: string) { setCurrency(value); localStorage.setItem("safepay-admin-currency", value); }

  async function loadAnalytics() {
    setLoading(true); setError("");
    const r = await createClient().rpc("admin_analytics_timeseries", { p_days: 365 });
    if (r.error) setError(r.error.message); else setAnalytics(Array.isArray(r.data) ? r.data : []);
    setLoading(false);
  }

  async function loadAdmins() {
    setLoading(true); setError("");
    const r = await createClient().rpc("admin_list_admin_users", { p_limit: 100, p_offset: 0 });
    if (r.error) setError(r.error.message); else {
      const data = r.data;
      setAdmins(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
    }
    setLoading(false);
  }

  async function addAdmin() {
    if (!newAdmin.trim()) return;
    setSaving(true); setError(""); setMessage("");
    const r = await createClient().rpc("admin_manage_admin_users", {
      p_target_user_id: newAdmin.trim(), p_action: "add", p_role: role,
      p_reason: "Ajout depuis le Centre de contrôle Admin SafePay",
    });
    if (r.error) setError(r.error.message);
    else { setMessage("Administrateur ajouté avec succès."); setNewAdmin(""); await loadAdmins(); }
    setSaving(false);
  }

  async function loadSettings() {
    setLoading(true); setError("");
    const r = await createClient().rpc("get_public_settings");
    if (r.error) setError(r.error.message); else setSettings(Object.entries(r.data || {}).map(([key, value]) => ({ key, value })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const now = new Date();
    let from: Date | null = start ? new Date(`${start}T00:00:00`) : null;
    let to: Date | null = end ? new Date(`${end}T23:59:59`) : null;
    if (!from && !to) { from = new Date(now); from.setDate(now.getDate() - Number(period) + 1); to = now; }
    return analytics.filter((x) => {
      const d = new Date(String(x.date).length === 10 ? `${x.date}T12:00:00` : x.date);
      return (!from || d >= from) && (!to || d <= to);
    });
  }, [analytics, start, end, period]);

  const totals = useMemo(() => filtered.reduce((a, x) => ({
    volume: a.volume + Number(x.transaction_volume ?? 0),
    revenue: a.revenue + Number(x.revenue ?? 0),
    deposits: a.deposits + Number(x.deposits ?? 0),
    withdrawals: a.withdrawals + Number(x.withdrawals ?? 0),
  }), { volume: 0, revenue: 0, deposits: 0, withdrawals: 0 }), [filtered]);

  const max = Math.max(1, ...filtered.map((x) => Number(x.transaction_volume ?? 0)));

  return <>
    <style>{`
      .sp-control-trigger{position:fixed;right:22px;bottom:22px;z-index:80;border:1px solid rgba(82,168,255,.3);background:linear-gradient(135deg,#1677ff,#0d55d5);color:#fff;border-radius:14px;padding:11px 15px;box-shadow:0 14px 35px rgba(0,0,0,.3),0 0 24px rgba(22,119,255,.22);font:700 11px Inter,system-ui;cursor:pointer}.sp-control-trigger:hover{transform:translateY(-1px)}
      .sp-control-backdrop{position:fixed;inset:0;background:rgba(1,5,12,.58);backdrop-filter:blur(5px);z-index:90;display:flex;justify-content:flex-end}.sp-control{height:100%;width:min(720px,100%);background:#071321;color:#eef6ff;border-left:1px solid rgba(148,163,184,.16);box-shadow:-20px 0 70px rgba(0,0,0,.35);display:flex;flex-direction:column;font:13px Inter,system-ui}.sp-control.light{background:#f7f9fc;color:#102033}.sp-control-head{padding:18px 20px;border-bottom:1px solid rgba(148,163,184,.14);display:flex;justify-content:space-between;align-items:center}.sp-control-head h2{margin:0;font-size:17px}.sp-control-head p{margin:4px 0 0;opacity:.58;font-size:10px}.sp-control-close{border:1px solid rgba(148,163,184,.2);background:transparent;color:inherit;border-radius:9px;width:34px;height:34px;cursor:pointer}.sp-tabs{display:flex;gap:5px;padding:10px 12px;overflow:auto;border-bottom:1px solid rgba(148,163,184,.12)}.sp-tabs button{white-space:nowrap;border:1px solid transparent;background:transparent;color:inherit;opacity:.62;padding:8px 10px;border-radius:9px;cursor:pointer;font-size:10px}.sp-tabs button.active{opacity:1;background:rgba(22,119,255,.12);border-color:rgba(82,168,255,.2)}.sp-control-body{padding:20px;overflow:auto;flex:1}.sp-section{border:1px solid rgba(148,163,184,.14);border-radius:15px;padding:16px;background:rgba(255,255,255,.025);margin-bottom:12px}.sp-control.light .sp-section{background:#fff}.sp-section h3{margin:0 0 5px;font-size:14px}.sp-muted{opacity:.58;font-size:10px;line-height:1.5}.sp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sp-stat{border:1px solid rgba(148,163,184,.13);border-radius:12px;padding:12px}.sp-stat span{display:block;opacity:.55;font-size:9px}.sp-stat strong{display:block;margin-top:6px;font-size:16px}.sp-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.sp-controls label{display:grid;gap:5px;font-size:9px;opacity:.75}.sp-controls input,.sp-controls select,.sp-form input,.sp-form select{height:36px;border-radius:9px;border:1px solid rgba(148,163,184,.2);background:rgba(255,255,255,.04);color:inherit;padding:0 10px;outline:none}.sp-control.light input,.sp-control.light select{background:#fff}.sp-btn{height:36px;border:1px solid rgba(82,168,255,.25);background:rgba(22,119,255,.1);color:inherit;border-radius:9px;padding:0 12px;cursor:pointer;font-weight:700;font-size:10px}.sp-btn.primary{background:#1677ff;color:#fff;border-color:#1677ff}.sp-btn.danger{color:#ff9ca8;border-color:rgba(255,102,120,.2)}.sp-chart{height:230px;display:flex;align-items:flex-end;gap:4px;padding:18px 5px 8px;overflow:hidden}.sp-chart-col{height:100%;flex:1;min-width:4px;display:flex;align-items:flex-end}.sp-chart-bar{width:100%;border-radius:4px 4px 1px 1px;background:linear-gradient(180deg,#52a8ff,#155ed4);min-height:3px}.sp-table{width:100%;border-collapse:collapse;font-size:10px}.sp-table th,.sp-table td{padding:9px;border-bottom:1px solid rgba(148,163,184,.1);text-align:left}.sp-table th{opacity:.5;font-size:8px;text-transform:uppercase}.sp-form{display:grid;grid-template-columns:1fr 160px;gap:8px}.sp-form input,.sp-form select{width:100%}.sp-prefs{display:grid;gap:8px}.sp-choice{display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid rgba(148,163,184,.12);border-radius:11px}.sp-choice span{font-size:11px}.sp-choice small{display:block;opacity:.5;font-size:8px;margin-top:3px}.sp-options{display:flex;gap:6px;flex-wrap:wrap}.sp-options button{border:1px solid rgba(148,163,184,.18);background:transparent;color:inherit;border-radius:8px;padding:8px 11px;cursor:pointer;font-size:9px}.sp-options button.selected{background:#1677ff;color:#fff;border-color:#1677ff}.sp-message{margin-bottom:10px;padding:9px 11px;border-radius:9px;background:rgba(57,217,138,.09);color:#7fe0ac;font-size:10px}.sp-error{margin-bottom:10px;padding:9px 11px;border-radius:9px;background:rgba(255,102,120,.09);color:#ffabb5;font-size:10px}
      html[data-admin-theme="light"] .adm-app{--a-bg:#f4f7fb!important;--a-panel:#ffffff!important;--a-panel2:#f1f5fa!important;--a-border:rgba(15,38,65,.12)!important;--a-text:#12243a!important;--a-muted:#62748a!important;--a-shadow:0 20px 55px rgba(15,38,65,.1)!important;background:#f4f7fb!important;color:#12243a!important}html[data-admin-theme="light"] .adm-sidebar{background:rgba(255,255,255,.95)!important}html[data-admin-theme="light"] .adm-header{background:rgba(255,255,255,.88)!important}html[data-admin-theme="light"] .adm-kpi,html[data-admin-theme="light"] .adm-panel,html[data-admin-theme="light"] .adm-hero{background:#fff!important}html[data-admin-theme="light"] .adm-heading h1,html[data-admin-theme="light"] .adm-kpi strong,html[data-admin-theme="light"] .adm-panel-head h3,html[data-admin-theme="light"] .adm-hero h2{color:#12243a!important}html[data-admin-theme="light"] .adm-search input,html[data-admin-theme="light"] td,html[data-admin-theme="light"] .adm-sidebar nav button{color:#33465c!important}
    `}</style>
    <button className="sp-control-trigger" onClick={() => setOpen(true)}>⚙ Centre de contrôle</button>
    {open && <div className="sp-control-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <aside className={`sp-control ${theme === "light" || (theme === "system" && document.documentElement.dataset.adminThemeResolved === "light") ? "light" : ""}`}>
        <div className="sp-control-head"><div><h2>Centre de contrôle SafePay</h2><p>Préférences et pilotage connectés au backend Admin.</p></div><button className="sp-control-close" onClick={() => setOpen(false)}>×</button></div>
        <div className="sp-tabs">{tabs.map(([key,label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => { setTab(key); setMessage(""); setError(""); }}>{label}</button>)}</div>
        <div className="sp-control-body">
          {message && <div className="sp-message">{message}</div>}{error && <div className="sp-error">{error}</div>}
          {tab === "analytics" && <section className="sp-section"><h3>Analytique</h3><p className="sp-muted">Données issues de <b>admin_analytics_timeseries</b>. Le revenu plateforme est calculé par le backend SafePay.</p><div className="sp-controls" style={{marginTop:12}}><label>Période<select value={period} onChange={(e)=>{setPeriod(e.target.value);setStart("");setEnd("")}}><option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option><option value="365">1 an</option></select></label><label>Début<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Fin<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><button className="sp-btn" onClick={loadAnalytics}>Actualiser</button></div><div className="sp-grid" style={{marginTop:12}}><div className="sp-stat"><span>Volume transactions</span><strong>{money(totals.volume,currency)}</strong></div><div className="sp-stat"><span>Revenus plateforme</span><strong>{money(totals.revenue,currency)}</strong></div><div className="sp-stat"><span>Dépôts</span><strong>{money(totals.deposits,currency)}</strong></div><div className="sp-stat"><span>Retraits</span><strong>{money(totals.withdrawals,currency)}</strong></div></div>{loading ? <p className="sp-muted" style={{marginTop:20}}>Chargement des données…</p> : <div className="sp-chart" title="Volume quotidien">{filtered.map((x,i)=><div className="sp-chart-col" key={`${x.date}-${i}`}><div className="sp-chart-bar" style={{height:`${Math.max(3,Number(x.transaction_volume??0)/max*100)}%`}} title={`${x.date}: ${money(x.transaction_volume,currency)}`}/></div>)}</div>}<p className="sp-muted">{filtered.length} points affichés sur la période sélectionnée.</p></section>}
          {tab === "language" && <section className="sp-section"><h3>Langue</h3><p className="sp-muted">Préférence d'interface sauvegardée sur cet appareil.</p><div className="sp-options" style={{marginTop:12}}><button className={language === "fr" ? "selected" : ""} onClick={()=>chooseLanguage("fr")}>Français</button><button className={language === "en" ? "selected" : ""} onClick={()=>chooseLanguage("en")}>English</button></div></section>}
          {tab === "theme" && <section className="sp-section"><h3>Thème</h3><p className="sp-muted">Le choix est conservé et appliqué immédiatement au Dashboard Admin.</p><div className="sp-options" style={{marginTop:12}}>{[["system","Système"],["light","Clair"],["dark","Sombre"]].map(([key,label])=><button key={key} className={theme===key?"selected":""} onClick={()=>chooseTheme(key)}>{label}</button>)}</div></section>}
          {tab === "currency" && <section className="sp-section"><h3>Devise d'affichage</h3><p className="sp-muted">Cette préférence modifie uniquement l'affichage des indicateurs, pas les soldes SafePay stockés en XOF.</p><div className="sp-options" style={{marginTop:12}}>{["XOF","EUR","USD"].map(v=><button key={v} className={currency===v?"selected":""} onClick={()=>chooseCurrency(v)}>{v}</button>)}</div></section>}
          {tab === "admins" && <><section className="sp-section"><h3>Ajouter un administrateur</h3><p className="sp-muted">L'utilisateur doit déjà exister dans Supabase Auth. Saisis son UUID puis choisis son rôle.</p><div className="sp-form" style={{marginTop:12}}><input value={newAdmin} onChange={e=>setNewAdmin(e.target.value)} placeholder="UUID de l'utilisateur"/><select value={role} onChange={e=>setRole(e.target.value)}><option value="admin">Admin</option><option value="super_admin">Super Admin</option><option value="support_admin">Support Admin</option></select></div><button className="sp-btn primary" style={{marginTop:8}} disabled={saving || !newAdmin.trim()} onClick={addAdmin}>{saving ? "Ajout…" : "Ajouter l'administrateur"}</button></section><section className="sp-section"><h3>Administrateurs existants</h3>{loading ? <p className="sp-muted">Chargement…</p> : <table className="sp-table"><thead><tr><th>Nom</th><th>Téléphone</th><th>Rôle</th><th>Statut</th></tr></thead><tbody>{admins.map((a,i)=><tr key={a.user_id||i}><td>{a.name||a.full_name||"—"}</td><td>{a.phone||"—"}</td><td>{a.role||"admin"}</td><td>{a.is_active===false?"Inactif":"Actif"}</td></tr>)}</tbody></table>}</section></>}
          {tab === "settings" && <section className="sp-section"><h3>Paramètres SafePay</h3><p className="sp-muted">Lecture directe de <b>get_public_settings</b>. Aucune valeur financière n'est inventée dans cette interface.</p>{loading ? <p className="sp-muted" style={{marginTop:12}}>Chargement…</p> : <table className="sp-table" style={{marginTop:12}}><thead><tr><th>Clé</th><th>Valeur backend</th></tr></thead><tbody>{settings.map(s=><tr key={s.key}><td>{s.key}</td><td>{typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value ?? "—")}</td></tr>)}</tbody></table>}</section>}
        </div>
      </aside>
    </div>}
  </>;
}
