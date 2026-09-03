"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Category = "account" | "appearance" | "locale" | "notifications" | "platform" | "security";

const categories: { id: Category; label: string; description: string }[] = [
  { id: "account", label: "Compte administrateur", description: "Profil, accès et sessions" },
  { id: "appearance", label: "Apparence", description: "Thème et confort d'utilisation" },
  { id: "locale", label: "Langue & région", description: "Langue, devise et formats" },
  { id: "notifications", label: "Notifications", description: "Préférences des alertes admin" },
  { id: "platform", label: "Plateforme", description: "Maintenance et fonctionnement" },
  { id: "security", label: "Sécurité", description: "Sessions et contrôles d'accès" },
];

const preferenceKey = "safepay-admin-preferences";

export default function AdminSettings() {
  const [category, setCategory] = useState<Category>("account");
  const [theme, setTheme] = useState<Theme>("system");
  const [language, setLanguage] = useState("fr");
  const [currency, setCurrency] = useState("XOF");
  const [dateFormat, setDateFormat] = useState("fr-FR");
  const [timezone, setTimezone] = useState("Africa/Lome");
  const [density, setDensity] = useState("comfortable");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState({ transactions: true, disputes: true, withdrawals: true, support: true, security: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(preferenceKey);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.theme) setTheme(p.theme);
      if (p.language) setLanguage(p.language);
      if (p.currency) setCurrency(p.currency);
      if (p.dateFormat) setDateFormat(p.dateFormat);
      if (p.timezone) setTimezone(p.timezone);
      if (p.density) setDensity(p.density);
      if (typeof p.sidebarCollapsed === "boolean") setSidebarCollapsed(p.sidebarCollapsed);
      if (p.notifications) setNotifications((x) => ({ ...x, ...p.notifications }));
    } catch { /* Ignore malformed local preferences. */ }
  }, []);

  function save() {
    const prefs = { theme, language, currency, dateFormat, timezone, density, sidebarCollapsed, notifications };
    localStorage.setItem(preferenceKey, JSON.stringify(prefs));
    localStorage.setItem("safepay-admin-currency", currency);
    window.dispatchEvent(new CustomEvent("safepay-admin-preferences-changed", { detail: prefs }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  const row = (key: keyof typeof notifications, label: string) => (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <span><strong className="block text-sm text-slate-900 dark:text-white">{label}</strong><span className="text-xs text-slate-500">Recevoir cette alerte dans le Dashboard.</span></span>
      <input aria-label={label} type="checkbox" checked={notifications[key]} onChange={(e) => setNotifications((x) => ({ ...x, [key]: e.target.checked }))} />
    </label>
  );

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configuration</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Paramètres</h2>
        <p className="mt-1 text-sm text-slate-500">Centre de configuration réservé à l'administration SafePay.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <nav aria-label="Catégories des paramètres" className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
          {categories.map((item) => (
            <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`w-full rounded-xl px-4 py-3 text-left transition ${category === item.id ? "bg-slate-100 dark:bg-slate-900" : "hover:bg-slate-50 dark:hover:bg-slate-900/60"}`}>
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{item.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          {category === "account" && <div className="space-y-4"><h3 className="text-lg font-semibold">Compte administrateur</h3><p className="text-sm text-slate-500">Les informations d'identité et les changements de mot de passe doivent utiliser Supabase Auth. Aucun secret n'est stocké ici.</p><div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">Gestion du profil, mot de passe, PIN et sessions à connecter aux mécanismes d'authentification existants.</div></div>}
          {category === "appearance" && <div className="space-y-5"><h3 className="text-lg font-semibold">Apparence</h3><label className="block text-sm font-medium">Thème<select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-950"><option value="light">Clair</option><option value="dark">Sombre</option><option value="system">Système</option></select></label><label className="block text-sm font-medium">Densité<select value={density} onChange={(e) => setDensity(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-950"><option value="comfortable">Confortable</option><option value="compact">Compacte</option></select></label><label className="flex items-center justify-between rounded-xl border p-4"><span className="text-sm font-medium">Sidebar réduite</span><input type="checkbox" checked={sidebarCollapsed} onChange={(e) => setSidebarCollapsed(e.target.checked)} /></label></div>}
          {category === "locale" && <div className="space-y-5"><h3 className="text-lg font-semibold">Langue & région</h3><label className="block text-sm font-medium">Langue<select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-950"><option value="fr">Français</option><option value="en">English</option></select></label><label className="block text-sm font-medium">Devise d'affichage<select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-950"><option value="XOF">XOF — Franc CFA</option><option value="EUR">EUR — Euro</option><option value="USD">USD — Dollar</option></select></label><label className="block text-sm font-medium">Format des dates<select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-950"><option value="fr-FR">Français</option><option value="en-US">English</option></select></label><label className="block text-sm font-medium">Fuseau horaire<input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-950" /></label><p className="text-xs text-slate-500">La devise choisie est synchronisée avec l'affichage financier du Dashboard. Elle ne modifie jamais la devise réelle d'une transaction.</p></div>}
          {category === "notifications" && <div className="space-y-3"><h3 className="mb-4 text-lg font-semibold">Notifications administrateur</h3>{row("transactions", "Transactions")}{row("disputes", "Litiges")}{row("withdrawals", "Retraits")}{row("support", "Support")}{row("security", "Sécurité")}</div>}
          {category === "platform" && <div className="space-y-4"><h3 className="text-lg font-semibold">Plateforme</h3><p className="text-sm text-slate-500">Les contrôles de maintenance et paramètres opérationnels doivent réutiliser les réglages backend existants. Aucun deuxième système de maintenance ou de paramètres financiers ne doit être créé ici.</p><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Les commissions restent exclusivement dans Finance & Commissions.</div></div>}
          {category === "security" && <div className="space-y-4"><h3 className="text-lg font-semibold">Sécurité</h3><div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">Sessions, authentification renforcée, alertes et actions sensibles doivent rester protégées côté backend/Supabase.</div></div>}

          <div className="mt-6 flex items-center justify-end gap-3 border-t pt-5"><span aria-live="polite" className="text-sm text-emerald-600">{saved ? "Préférences enregistrées" : ""}</span><button type="button" onClick={save} className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm">Enregistrer</button></div>
        </div>
      </div>
    </section>
  );
}
