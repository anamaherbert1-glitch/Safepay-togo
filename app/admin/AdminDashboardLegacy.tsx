"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminStyles from "./AdminStyles";

type Row = Record<string, any>;
type Module =
  | "overview" | "users" | "transactions" | "wallets" | "ledger"
  | "deposits" | "withdrawals" | "disputes" | "support" | "notifications"
  | "revenue" | "finance" | "settings" | "features" | "security"
  | "admins" | "audit";

const modules: [Module, string, string][] = [
  ["overview", "Vue générale", "Pilotage Cyenoo"],
  ["users", "Utilisateurs", "Comptes & activité"],
  ["transactions", "Transactions", "Flux financiers"],
  ["wallets", "Wallets", "Soldes"],
  ["ledger", "Ledger", "Journal financier"],
  ["deposits", "Dépôts", "Recharges"],
  ["withdrawals", "Retraits", "Payouts"],
  ["disputes", "Litiges", "Escrow & résolution"],
  ["support", "Support", "Tickets clients"],
  ["notifications", "Notifications", "Communication"],
  ["revenue", "Revenus", "Performance financière"],
  ["finance", "Finance & Commissions", "Gestion des commissions"],
  ["settings", "Paramètres", "Préférences système"],
  ["features", "Fonctionnalités", "Feature flags"],
  ["security", "Sécurité", "Contrôles & accès"],
  ["admins", "Administrateurs", "Gestion des accès"],
  ["audit", "Audit logs", "Traçabilité"],
];

const money = (v: any) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const date = (v: any) =>
  v ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";

function Icon({ name }: { name: string }) {
  const map: Record<string, string> = {
    refresh: "↻", close: "×", users: "👥", money: "💰", alert: "⚠", check: "✓", shield: "🛡", chart: "📊",
  };
  return <span aria-hidden>{map[name] || "•"}</span>;
}

export default function AdminDashboardLegacy() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [module, setModule] = useState<Module>("overview");
  const [stats, setStats] = useState<Row>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const rpc = useCallback(
    async (name: string, args: Record<string, any> = {}) => {
      const r = await supabase.rpc(name, args);
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
    [supabase]
  );

  useEffect(() => {
    (async () => {
      try {
        const ok = await rpc("is_admin");
        setAllowed(!!ok);
      } catch (e: any) {
        setError(e.message || "Accès refusé");
        setAllowed(false);
      } finally {
        setReady(true);
      }
    })();
  }, [rpc]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setBusy(true);
    setError("");
    try {
      if (module === "overview") {
        const s = await rpc("admin_dashboard_stats");
        setStats(s || {});
        setRows([]);
      } else if (module === "users") {
        const d = await rpc("admin_list_users", { p_search: search || null, p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "transactions") {
        const d = await rpc("admin_list_transactions", { p_status: null, p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "wallets") {
        const d = await rpc("admin_list_wallets", { p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "ledger") {
        const d = await rpc("admin_list_ledger", { p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "deposits") {
        const d = await rpc("admin_list_deposits", { p_status: null, p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "withdrawals") {
        const d = await rpc("admin_list_withdrawals", { p_status: null, p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "disputes") {
        const d = await rpc("admin_list_disputes", { p_status: null, p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "support") {
        const d = await rpc("admin_list_support_tickets", { p_status: null, p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "admins") {
        const d = await rpc("admin_list_admin_users");
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "audit") {
        const d = await rpc("admin_list_audit_logs", { p_limit: 100, p_offset: 0 });
        setRows(Array.isArray(d) ? d : d?.items || []);
      } else if (module === "finance" || module === "revenue") {
        const s = await rpc("admin_dashboard_stats");
        setStats(s || {});
        setRows([]);
      } else {
        setRows([]);
      }
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [allowed, module, rpc, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!ready) {
    return (
      <main className="adm-app">
        <AdminStyles />
        <div className="adm-loading">Chargement Cyenoo Admin…</div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="adm-app">
        <AdminStyles />
        <div className="adm-loading" style={{ flexDirection: "column", gap: 12 }}>
          <div className="adm-logo">C</div>
          <h2 style={{ margin: 0 }}>Cyenoo Admin</h2>
          <p style={{ color: "#8398ad" }}>Connexion sécurisée au centre de pilotage.</p>
          <p className="adm-error">{error || "Accès administrateur requis."}</p>
          <button className="adm-primary" onClick={() => router.push("/dashboard")}>Retour à Cyenoo</button>
        </div>
      </main>
    );
  }

  const active = modules.find((m) => m[0] === module)!;

  const columns = useMemo(() => {
    if (!rows.length) return [] as string[];
    return Object.keys(rows[0]).slice(0, 8);
  }, [rows]);

  return (
    <main className="adm-app">
      <AdminStyles />
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <div className="adm-brand-mark">C</div>
          <div>
            <strong>Cyenoo</strong>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>
        <nav>
          {modules.map(([id, label]) => (
            <button key={id} className={module === id ? "active" : ""} onClick={() => setModule(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="adm-side-footer">
          <button className="adm-secondary" onClick={() => router.push("/dashboard")}>
            Retour à Cyenoo
          </button>
        </div>
      </aside>

      <section className="adm-main">
        <header className="adm-header">
          <div>
            <span className="adm-eyebrow">{active[2]}</span>
            <h1>{active[1]}</h1>
          </div>
          <div className="adm-header-right">
            <div className="adm-live">
              <i /> Backend Cyenoo connecté
            </div>
            <button className="adm-refresh" onClick={() => void load()} disabled={busy}>
              <Icon name="refresh" /> Actualiser
            </button>
          </div>
        </header>

        {toast && <div className="adm-toast">{toast}</div>}
        {error && <div className="adm-error">{error}</div>}

        {module === "overview" && (
          <div className="adm-hero">
            <div className="adm-heading">
              <h2>Vue globale des activités Cyenoo</h2>
              <p>Alimentée directement par Supabase.</p>
            </div>
            <div className="adm-kpis">
              {[
                ["Utilisateurs", stats.users_count ?? stats.total_users],
                ["Transactions", stats.transactions_count ?? stats.total_transactions],
                ["Volume", stats.volume_total ?? stats.total_volume, true],
                ["Wallets", stats.wallets_count],
                ["Litiges ouverts", stats.open_disputes ?? stats.disputes_open],
                ["Retraits en attente", stats.pending_withdrawals],
              ].map(([label, value, isMoney]) => (
                <div className="adm-kpi" key={String(label)}>
                  <div className="adm-kpi-top">
                    <span>{label}</span>
                  </div>
                  <strong>{isMoney ? money(value) : value ?? "—"}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {(module === "finance" || module === "revenue") && (
          <div className="adm-hero">
            <div className="adm-heading">
              <h2>{module === "finance" ? "Commissions Cyenoo" : "Revenus Cyenoo"}</h2>
              <p>Données issues des RPC administratives Cyenoo.</p>
            </div>
            <div className="adm-kpis">
              {[
                ["Volume total", stats.volume_total ?? stats.total_volume, true],
                ["Frais collectés", stats.fees_total ?? stats.total_fees, true],
                ["Commissions", stats.commissions_total, true],
              ].map(([label, value, isMoney]) => (
                <div className="adm-kpi" key={String(label)}>
                  <div className="adm-kpi-top">
                    <span>{label}</span>
                  </div>
                  <strong>{isMoney ? money(value) : value ?? "—"}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {module === "users" && (
          <div className="adm-data-toolbar">
            <input
              className="adm-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
            />
            <button className="adm-primary" onClick={() => void load()} disabled={busy}>
              Chercher
            </button>
          </div>
        )}

        {module !== "overview" && module !== "finance" && module !== "revenue" && module !== "settings" && module !== "features" && module !== "security" && (
          <div className="adm-table-wrap">
            {busy ? (
              <div className="adm-loading">Chargement…</div>
            ) : rows.length === 0 ? (
              <div className="adm-empty">Aucune donnée pour ce module.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c}>{c.replace(/_/g, " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id || r.user_id || i}>
                      {columns.map((c) => (
                        <td key={c}>
                          {/amount|balance|volume|fee/i.test(c)
                            ? money(r[c])
                            : /created_at|updated_at|submitted_at/i.test(c)
                              ? date(r[c])
                              : r[c] === null || r[c] === undefined || r[c] === ""
                                ? "—"
                                : typeof r[c] === "object"
                                  ? JSON.stringify(r[c])
                                  : String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {(module === "settings" || module === "features" || module === "security") && (
          <div className="adm-hero">
            <div className="adm-heading">
              <h2>{active[1]}</h2>
              <p>
                Module connecté au backend Cyenoo. Les opérations financières restent contrôlées par les RPC
                administratives.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
