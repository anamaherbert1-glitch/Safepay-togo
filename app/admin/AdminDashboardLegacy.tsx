"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminStyles from "./AdminStyles";
import FinanceCommission from "./FinanceCommission";
import AdminSettings from "./AdminSettings";

type Row = Record<string, any>;
type Module =
  | "overview" | "users" | "transactions" | "wallets" | "ledger"
  | "deposits" | "withdrawals" | "disputes" | "support" | "notifications"
  | "revenue" | "finance" | "settings" | "features" | "security"
  | "admins" | "audit";

type Dialog =
  | { kind: "withdrawal"; row: Row }
  | { kind: "notify"; row: Row }
  | { kind: "user-status"; row: Row }
  | { kind: "dispute"; row: Row }
  | null;

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

const DEFAULT_FLAGS: { key: string; label: string; description: string }[] = [
  { key: "deposits_enabled", label: "Dépôts", description: "Autoriser les recharges wallet" },
  { key: "withdrawals_enabled", label: "Retraits", description: "Autoriser les payouts" },
  { key: "transfers_enabled", label: "Transferts", description: "Paiements P2P / escrow" },
  { key: "disputes_enabled", label: "Litiges", description: "Ouverture de litiges clients" },
  { key: "notifications_enabled", label: "Notifications", description: "Push & in-app" },
  { key: "maintenance_mode", label: "Mode maintenance", description: "Suspendre les opérations" },
];

const money = (v: any) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const date = (v: any) =>
  v ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v)) : "—";

function CyenooMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <ellipse cx="60" cy="68" rx="46" ry="16" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="3.5" transform="rotate(-26 60 68)" />
      <path d="M82 26c-20-12-48-8-60 12-13 20-9 46 12 58 18 11 42 9 56-4" fill="none" stroke="#fff" strokeWidth="15" strokeLinecap="round" />
      <rect x="46" y="58" width="10" height="20" rx="2.5" fill="#fff" />
      <rect x="59" y="48" width="10" height="30" rx="2.5" fill="#fff" />
      <rect x="72" y="38" width="10" height="40" rx="2.5" fill="#fff" />
      <rect x="85" y="28" width="10" height="50" rx="2.5" fill="#fff" />
    </svg>
  );
}

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
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [choice, setChoice] = useState("completed");
  const [text, setText] = useState("");

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

  const loadFlags = useCallback(async () => {
    const { data, error: qErr } = await supabase.from("feature_flags").select("key,enabled");
    if (qErr) throw new Error(qErr.message);
    const map: Record<string, boolean> = {};
    DEFAULT_FLAGS.forEach((f) => {
      map[f.key] = false;
    });
    (data || []).forEach((row: any) => {
      map[row.key] = !!row.enabled;
    });
    setFlags(map);
  }, [supabase]);

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
      } else if (module === "revenue") {
        const s = await rpc("admin_dashboard_stats");
        setStats(s || {});
        setRows([]);
      } else if (module === "features") {
        await loadFlags();
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
  }, [allowed, module, rpc, search, loadFlags]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function toggleFlag(key: string, enabled: boolean) {
    setActionBusy(true);
    setError("");
    try {
      await rpc("admin_set_feature_flag", {
        p_key: key,
        p_enabled: enabled,
        p_reason: "Modification depuis le Dashboard Admin Cyenoo",
      });
      setFlags((prev) => ({ ...prev, [key]: enabled }));
      setToast(`Flag « ${key} » ${enabled ? "activé" : "désactivé"}.`);
    } catch (e: any) {
      setError(e.message || "Impossible de modifier le flag");
    } finally {
      setActionBusy(false);
    }
  }

  async function runDialogAction() {
    if (!dialog) return;
    setActionBusy(true);
    setError("");
    try {
      if (dialog.kind === "withdrawal") {
        await rpc("admin_update_withdrawal_status", {
          p_withdrawal_id: dialog.row.id,
          p_status: choice,
          p_reason: text || "Mise à jour depuis le Dashboard Admin Cyenoo",
        });
        setToast("Retrait mis à jour dans Cyenoo.");
      } else if (dialog.kind === "notify") {
        if (!text.trim()) throw new Error("Message requis");
        await rpc("admin_send_notification", {
          p_user_id: dialog.row.id,
          p_title: "Message Cyenoo",
          p_message: text.trim(),
        });
        setToast("Notification envoyée.");
      } else if (dialog.kind === "user-status") {
        const nextActive = !(dialog.row.is_active ?? true);
        await rpc("admin_set_account_status", {
          p_user_id: dialog.row.id,
          p_is_active: nextActive,
          p_reason: text || (nextActive ? "Réactivation compte" : "Suspension compte"),
        });
        setToast(nextActive ? "Compte réactivé." : "Compte suspendu.");
      } else if (dialog.kind === "dispute") {
        if (!text.trim()) throw new Error("Justification requise");
        await rpc("admin_resolve_dispute", {
          p_dispute_id: dialog.row.id,
          p_resolution: text.trim(),
          p_resolution_action: choice,
        });
        setToast("Litige résolu dans Cyenoo.");
      }
      setDialog(null);
      setText("");
      await load();
    } catch (e: any) {
      setError(e.message || "Action impossible");
    } finally {
      setActionBusy(false);
    }
  }

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
          <div className="adm-logo" style={{ display: "grid", placeItems: "center" }}>
            <CyenooMark size={28} />
          </div>
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
    return Object.keys(rows[0]).slice(0, 7);
  }, [rows]);

  const showTable =
    module !== "overview" &&
    module !== "finance" &&
    module !== "revenue" &&
    module !== "settings" &&
    module !== "features" &&
    module !== "security";

  const actionModules = module === "withdrawals" || module === "users" || module === "disputes";

  return (
    <main className="adm-app">
      <AdminStyles />
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <div className="adm-brand-mark" style={{ padding: 6 }}>
            <CyenooMark size={30} />
          </div>
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
            <div className="adm-quick" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button className="adm-primary" onClick={() => setModule("withdrawals")}>Traiter les retraits</button>
              <button className="adm-secondary" onClick={() => setModule("disputes")}>Voir les litiges</button>
              <button className="adm-secondary" onClick={() => setModule("users")}>Utilisateurs</button>
              <button className="adm-secondary" onClick={() => setModule("features")}>Feature flags</button>
            </div>
          </div>
        )}

        {module === "revenue" && (
          <div className="adm-hero">
            <div className="adm-heading">
              <h2>Revenus Cyenoo</h2>
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

        {module === "finance" && (
          <div className="adm-panel" style={{ padding: 8 }}>
            <FinanceCommission />
          </div>
        )}

        {module === "settings" && (
          <div className="adm-panel" style={{ padding: 8 }}>
            <AdminSettings />
          </div>
        )}

        {module === "features" && (
          <div className="adm-hero">
            <div className="adm-heading">
              <span className="adm-eyebrow">FEATURE FLAGS</span>
              <h2>Contrôle des fonctionnalités</h2>
              <p>
                Les interrupteurs écrivent dans <b>feature_flags</b> via <b>admin_set_feature_flag</b>.
              </p>
            </div>
            {busy ? (
              <div className="adm-loading">Chargement des flags…</div>
            ) : (
              <div className="adm-feature-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {DEFAULT_FLAGS.map((f) => {
                  const on = !!flags[f.key];
                  return (
                    <div
                      key={f.key}
                      className="adm-feature-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "14px 16px",
                        borderRadius: 14,
                        border: "1px solid rgba(135,185,235,.15)",
                        background: "rgba(13,29,48,.8)",
                      }}
                    >
                      <div>
                        <strong style={{ display: "block" }}>{f.label}</strong>
                        <small style={{ color: "#8398ad" }}>{f.description}</small>
                        <div style={{ marginTop: 4, fontSize: 11, color: "#6e8ba7" }}>{f.key}</div>
                      </div>
                      <button
                        className={on ? "adm-primary" : "adm-secondary"}
                        disabled={actionBusy}
                        onClick={() => void toggleFlag(f.key, !on)}
                        style={{ minWidth: 88 }}
                      >
                        {on ? "ON" : "OFF"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {module === "security" && (
          <div className="adm-hero">
            <div className="adm-heading">
              <h2>Sécurité</h2>
              <p>Garde-fous Cyenoo. Les opérations sensibles passent par les RPC admin.</p>
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

        {showTable && (
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
                    {actionModules && <th>Actions</th>}
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
                      {module === "withdrawals" && (
                        <td>
                          <button
                            className="adm-secondary"
                            onClick={() => {
                              setChoice("completed");
                              setText("");
                              setDialog({ kind: "withdrawal", row: r });
                            }}
                          >
                            Traiter
                          </button>
                        </td>
                      )}
                      {module === "disputes" && (
                        <td>
                          <button
                            className="adm-secondary"
                            onClick={() => {
                              setChoice("refund_buyer");
                              setText("");
                              setDialog({ kind: "dispute", row: r });
                            }}
                          >
                            Résoudre
                          </button>
                        </td>
                      )}
                      {module === "users" && (
                        <td style={{ display: "flex", gap: 6 }}>
                          <button
                            className="adm-secondary"
                            onClick={() => {
                              setText("");
                              setDialog({ kind: "notify", row: r });
                            }}
                          >
                            Notifier
                          </button>
                          <button
                            className="adm-secondary"
                            onClick={() => {
                              setText("");
                              setDialog({ kind: "user-status", row: r });
                            }}
                          >
                            {(r.is_active ?? true) ? "Suspendre" : "Activer"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {dialog && (
        <div className="adm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <div>
                <span>ACTION SÉCURISÉE</span>
                <h3>
                  {dialog.kind === "withdrawal"
                    ? "Traitement du retrait"
                    : dialog.kind === "notify"
                      ? "Notifier l'utilisateur"
                      : dialog.kind === "dispute"
                        ? "Résolution du litige"
                        : (dialog.row.is_active ?? true)
                          ? "Suspendre le compte"
                          : "Réactiver le compte"}
                </h3>
              </div>
              <button onClick={() => setDialog(null)}><Icon name="close" /></button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-modal-context">
                <b>{dialog.row.full_name || dialog.row.name || dialog.row.phone || dialog.row.id}</b>
                <small>{dialog.row.phone || dialog.row.status || dialog.row.id}</small>
              </div>
              {dialog.kind === "withdrawal" && (
                <label className="adm-modal-label">
                  Nouveau statut
                  <select value={choice} onChange={(e) => setChoice(e.target.value)}>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              )}
              {dialog.kind === "dispute" && (
                <label className="adm-modal-label">
                  Décision
                  <select value={choice} onChange={(e) => setChoice(e.target.value)}>
                    <option value="refund_buyer">Rembourser l'acheteur</option>
                    <option value="release_seller">Libérer au vendeur</option>
                  </select>
                </label>
              )}
              <label className="adm-modal-label">
                {dialog.kind === "notify" ? "Message" : "Motif / justification"}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    dialog.kind === "notify"
                      ? "Message à envoyer…"
                      : dialog.kind === "dispute"
                        ? "Explication de la décision…"
                        : "Justification…"
                  }
                />
              </label>
            </div>
            <div className="adm-modal-foot">
              <button className="ghost" onClick={() => setDialog(null)}>Annuler</button>
              <button
                className="adm-primary"
                disabled={
                  actionBusy ||
                  (dialog.kind === "notify" && !text.trim()) ||
                  (dialog.kind === "dispute" && !text.trim())
                }
                onClick={() => void runDialogAction()}
              >
                {actionBusy ? "Traitement…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
