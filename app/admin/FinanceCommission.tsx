"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = Record<string, any>;

const money = (v: any) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));

export default function FinanceCommission() {
  const [setting, setSetting] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: queryError } = await createClient()
        .from("safepay_fee_settings")
        .select(
          "commission_percent,commission_fixed,fee_payer,minimum_fee,maximum_fee,currency,version"
        )
        .eq("active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (queryError) setError(queryError.message);
      else setSetting(data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="adm-panel">
        <h2>Finance &amp; Commissions</h2>
        <p>Chargement…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="adm-panel">
        <h2>Finance &amp; Commissions</h2>
        <p>{error}</p>
      </section>
    );
  }

  const payer =
    setting?.fee_payer === "split"
      ? "50 / 50"
      : setting?.fee_payer === "seller"
        ? "Vendeur"
        : setting?.fee_payer === "buyer"
          ? "Acheteur"
          : "—";

  const values = [
    ["Commission", setting ? `${setting.commission_percent}%` : "—"],
    ["Frais fixe", setting ? money(setting.commission_fixed) : "—"],
    ["Payeur", payer],
    ["Minimum", setting ? money(setting.minimum_fee) : "—"],
    ["Maximum", setting?.maximum_fee == null ? "Aucun" : money(setting.maximum_fee)],
    ["Devise", setting?.currency || "XOF"],
    ["Version", setting?.version ?? "—"],
  ];

  return (
    <section className="adm-settings">
      <div className="adm-section-intro">
        <div>
          <span>FINANCE</span>
          <h2>Commissions SafePay</h2>
          <p>
            Source unique : <b>safepay_fee_settings</b>. Les transactions
            utilisent le moteur backend et un snapshot financier immuable.
          </p>
        </div>
        <div className="adm-lock">Backend source of truth</div>
      </div>

      <div className="adm-settings-grid">
        {values.map(([label, value]) => (
          <div className="adm-setting" key={label}>
            <div>
              <span>{label}</span>
              <p>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
