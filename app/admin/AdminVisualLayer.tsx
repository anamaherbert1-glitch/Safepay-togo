"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminOverview from "./AdminOverview";

type Row = Record<string, any>;
type Module = "overview" | "users" | "kyc" | "transactions" | "wallets" | "ledger" | "deposits" | "withdrawals" | "disputes" | "support" | "notifications" | "revenue" | "invoices" | "settings" | "features" | "audit" | "admins" | "security";

export default function AdminVisualLayer() {
  const pathname = usePathname();
  const router = useRouter();
  const [summary, setSummary] = useState<Row>({});
  const [analytics, setAnalytics] = useState<Row[]>([]);
  const [days, setDays] = useState(7);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname !== "/admin") return;
    let cancelled = false;
    (async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) return;
      const gate = await s.rpc("is_admin");
      if (gate.error || !gate.data) return;
      const [stats, series] = await Promise.all([
        s.rpc("admin_dashboard_stats"),
        s.rpc("admin_analytics_timeseries", { p_days: 7 }),
      ]);
      if (cancelled) return;
      if (stats.data) setSummary(stats.data);
      if (Array.isArray(series.data)) setAnalytics(series.data);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  async function changeDays(next: number) {
    setDays(next);
    const r = await createClient().rpc("admin_analytics_timeseries", { p_days: next });
    if (Array.isArray(r.data)) setAnalytics(r.data);
  }

  if (pathname !== "/admin" || !ready) return null;

  const navigate = (module: Module) => {
    if (module === "overview") return;
    const paths: Record<string, string> = {
      users: "/admin?module=users", kyc: "/admin?module=kyc", transactions: "/admin?module=transactions",
      wallets: "/admin?module=wallets", ledger: "/admin?module=ledger", deposits: "/admin?module=deposits",
      withdrawals: "/admin?module=withdrawals", disputes: "/admin?module=disputes", support: "/admin?module=support",
      notifications: "/admin?module=notifications", revenue: "/admin?module=revenue", invoices: "/admin?module=invoices",
      settings: "/admin?module=settings", features: "/admin?module=features", audit: "/admin?module=audit",
      admins: "/admin?module=admins", security: "/admin?module=security",
    };
    router.push(paths[module] ?? "/admin");
  };

  return <div className="sp-admin-visual-layer"><AdminOverview summary={summary} analytics={analytics} days={days} setDays={changeDays} navigate={navigate}/></div>;
}
