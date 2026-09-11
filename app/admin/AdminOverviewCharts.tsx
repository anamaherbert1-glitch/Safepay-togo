"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Point = Record<string, any>;

const money = (v: any) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));

function dayLabel(d: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(d));
  } catch {
    return String(d).slice(5, 10);
  }
}

function BarChart({
  title,
  subtitle,
  data,
  valueKey,
  color = "#2d91ff",
  format = "number",
}: {
  title: string;
  subtitle?: string;
  data: Point[];
  valueKey: string;
  color?: string;
  format?: "number" | "money";
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey] ?? 0)));
  return (
    <div
      className="adm-panel"
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(135,185,235,.15)",
        background: "rgba(10,22,37,.9)",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <strong style={{ display: "block", fontSize: 15 }}>{title}</strong>
        {subtitle && <small style={{ color: "#8398ad" }}>{subtitle}</small>}
      </div>
      {!data.length ? (
        <div className="adm-empty-chart" style={{ color: "#8398ad", padding: "28px 0", textAlign: "center" }}>
          Pas encore de données sur cette période
        </div>
      ) : (
        <div
          className="adm-bars"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 160,
            paddingTop: 8,
          }}
        >
          {data.map((x, i) => {
            const n = Number(x[valueKey] ?? 0);
            const h = Math.max(4, Math.round((n / max) * 130));
            const label = dayLabel(String(x.date || x.day || x.label || i));
            return (
              <div
                key={String(x.date || i)}
                className="adm-bar-col"
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}
                title={`${label}: ${format === "money" ? money(n) : n}`}
              >
                <div style={{ fontSize: 10, color: "#b6c5d4", fontWeight: 700 }}>
                  {format === "money" ? (n >= 1000 ? `${Math.round(n / 1000)}k` : n) : n}
                </div>
                <div
                  className="adm-bar"
                  style={{
                    width: "100%",
                    maxWidth: 28,
                    height: h,
                    borderRadius: "8px 8px 4px 4px",
                    background: `linear-gradient(180deg, ${color}, ${color}99)`,
                    boxShadow: `0 8px 18px ${color}33`,
                  }}
                />
                <div style={{ fontSize: 9, color: "#6e8ba7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminOverviewCharts() {
  const [stats, setStats] = useState<Point>({});
  const [series, setSeries] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const s = createClient();
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - (days - 1));
      const rangeStart = start.toISOString().slice(0, 10);
      const rangeEnd = end.toISOString().slice(0, 10);

      const [statsRes, overviewRes, analyticsRes] = await Promise.all([
        s.rpc("admin_dashboard_stats"),
        s.rpc("admin_overview_timeseries", { p_start_date: rangeStart, p_end_date: rangeEnd }),
        s.rpc("admin_analytics_timeseries", { p_days: days }),
      ]);

      if (statsRes.error) throw new Error(statsRes.error.message);
      setStats(statsRes.data || {});

      // Prefer overview timeseries; fallback to analytics
      let points: Point[] = [];
      if (!overviewRes.error && overviewRes.data) {
        points = Array.isArray(overviewRes.data) ? overviewRes.data : overviewRes.data?.items || [];
      } else if (!analyticsRes.error && analyticsRes.data) {
        points = Array.isArray(analyticsRes.data) ? analyticsRes.data : analyticsRes.data?.items || [];
      }

      // Normalize keys
      points = points.map((p) => ({
        date: p.date || p.day || p.bucket || p.ts,
        new_users: Number(p.new_users ?? p.users_created ?? p.signups ?? p.user_count ?? 0),
        transactions: Number(p.transactions ?? p.transaction_count ?? p.tx_count ?? 0),
        transaction_volume: Number(p.transaction_volume ?? p.volume ?? p.total_volume ?? 0),
        active_users: Number(p.active_users ?? p.dau ?? 0),
      }));

      setSeries(points);
    } catch (e: any) {
      setError(e.message || "Impossible de charger les graphiques");
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const newUsers = series.reduce((a, p) => a + Number(p.new_users || 0), 0);
    const txs = series.reduce((a, p) => a + Number(p.transactions || 0), 0);
    const volume = series.reduce((a, p) => a + Number(p.transaction_volume || 0), 0);
    return { newUsers, txs, volume };
  }, [series]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="adm-heading">
        <h2 style={{ margin: "0 0 4px" }}>Vue globale des activités Cyenoo</h2>
        <p style={{ margin: 0, color: "#8398ad" }}>
          Trafic, comptes créés et transactions — données Supabase en temps réel.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "#8398ad", fontSize: 12, fontWeight: 700 }}>Période</span>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            className={days === d ? "adm-primary" : "adm-secondary"}
            onClick={() => setDays(d)}
            style={{ minHeight: 36, padding: "6px 12px" }}
          >
            {d}j
          </button>
        ))}
        <button className="adm-secondary" onClick={() => void load()} style={{ minHeight: 36 }}>
          Actualiser
        </button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-kpis">
        {[
          ["Comptes total", stats.users_count ?? stats.total_users],
          ["Nouveaux comptes (période)", totals.newUsers],
          ["Transactions (période)", totals.txs],
          ["Volume (période)", totals.volume, true],
          ["Wallets", stats.wallets_count],
          ["Litiges ouverts", stats.open_disputes ?? stats.disputes_open],
          ["Retraits en attente", stats.pending_withdrawals],
          ["Transactions total", stats.transactions_count ?? stats.total_transactions],
        ].map(([label, value, isMoney]) => (
          <div className="adm-kpi" key={String(label)}>
            <div className="adm-kpi-top">
              <span>{label}</span>
            </div>
            <strong>{isMoney ? money(value) : value ?? "—"}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="adm-loading">Chargement des graphiques…</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <BarChart
            title="Comptes créés"
            subtitle={`Nouveaux utilisateurs — ${days} derniers jours`}
            data={series}
            valueKey="new_users"
            color="#35d391"
          />
          <BarChart
            title="Transactions"
            subtitle={`Nombre de transactions — ${days} derniers jours`}
            data={series}
            valueKey="transactions"
            color="#2d91ff"
          />
          <BarChart
            title="Volume (XOF)"
            subtitle={`Volume traité — ${days} derniers jours`}
            data={series}
            valueKey="transaction_volume"
            color="#f3b53f"
            format="money"
          />
          <BarChart
            title="Trafic utilisateurs actifs"
            subtitle={`Activité quotidienne — ${days} derniers jours`}
            data={series}
            valueKey="active_users"
            color="#7b61ff"
          />
        </div>
      )}
    </div>
  );
}
