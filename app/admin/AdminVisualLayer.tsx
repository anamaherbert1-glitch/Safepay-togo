"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminOverview from "./AdminOverview";

type Row = Record<string, any>;
type Module = "overview" | "users" | "kyc" | "transactions" | "wallets" | "ledger" | "deposits" | "withdrawals" | "disputes" | "support" | "notifications" | "revenue" | "invoices" | "settings" | "features" | "audit" | "admins" | "security";

const labels: Record<Module, string> = {
  overview:"Vue générale",users:"Utilisateurs",kyc:"KYC",transactions:"Transactions",wallets:"Wallets",ledger:"Ledger",deposits:"Dépôts",withdrawals:"Retraits",disputes:"Litiges",support:"Support",notifications:"Notifications",revenue:"Revenus",invoices:"Factures",settings:"Paramètres",features:"Fonctionnalités",audit:"Audit logs",admins:"Administrateurs",security:"Sécurité"
};

export default function AdminVisualLayer() {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Row>({});
  const [analytics, setAnalytics] = useState<Row[]>([]);
  const [days, setDays] = useState(7);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname !== "/admin") return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async () => {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) return;
      const gate = await s.rpc("is_admin");
      if (gate.error || !gate.data) return;
      const [stats, series] = await Promise.all([s.rpc("admin_dashboard_stats"), s.rpc("admin_analytics_timeseries", { p_days: 7 })]);
      if (cancelled) return;
      if (stats.data) setSummary(stats.data);
      if (Array.isArray(series.data)) setAnalytics(series.data);
      setReady(true);
    };
    load();
    timer = setInterval(() => {
      const active = document.querySelector(".adm-sidebar nav button.active")?.textContent?.trim() ?? "";
      if (active && !active.includes(labels.overview)) setReady(false);
      if (active && active.includes(labels.overview)) setReady(true);
    }, 250);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [pathname]);

  async function changeDays(next: number) {
    setDays(next);
    const r = await createClient().rpc("admin_analytics_timeseries", { p_days: next });
    if (Array.isArray(r.data)) setAnalytics(r.data);
  }

  const navigate = (module: Module) => {
    if (module === "overview") return;
    const target = labels[module];
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".adm-sidebar nav button")).find((b) => b.textContent?.includes(target));
    if (button) button.click();
  };

  if (pathname !== "/admin" || !ready) return null;
  return <div className="sp-admin-visual-layer"><AdminOverview summary={summary} analytics={analytics} days={days} setDays={changeDays} navigate={navigate}/></div>;
}
