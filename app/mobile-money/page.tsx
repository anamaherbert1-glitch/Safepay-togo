"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CYENOO_CORRIDORS,
  CorridorCountry,
  corridorFromCountryCode,
  operatorsForCountry,
} from "@/lib/mm-operators";
import { OperatorBadge } from "@/components/mm/OperatorBadge";

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export default function MobileMoneyPage() {
  const router = useRouter();
  const [country, setCountry] = useState<CorridorCountry>("TG");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = createClient();
        const { data } = await s.rpc("get_my_profile");
        if (!active) return;
        const profile = Array.isArray(data) ? data[0] : data;
        if (profile?.country) setCountry(corridorFromCountryCode(String(profile.country)));
      } catch {
        /* keep TG */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const operators = operatorsForCountry(country);
  const countryLabel = CYENOO_CORRIDORS.find((c) => c.code === country)?.label ?? country;

  return (
    <main className="safepay-shell cyenoo-shell safepay-dashboard cyenoo-dashboard">
      <header className="sp-header">
        <button className="sp-back" onClick={() => router.back()} aria-label="Retour">
          <BackIcon />
        </button>
        <strong>Mobile Money</strong>
        <span className="sp-header-spacer" />
      </header>
      <section className="sp-content">
        <p className="sp-eyebrow">Cyenoo</p>
        <h1 className="sp-title">Mobile Money</h1>
        <p className="sp-muted">
          Opérateurs disponibles selon votre pays. Les envois restent dans le même pays.
        </p>

        <section className="sp-section-card">
          <label>
            Pays
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CorridorCountry)}
            >
              {CYENOO_CORRIDORS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <p className="sp-muted" style={{ marginTop: 8, fontSize: 12 }}>
            Opérateurs pour <strong>{countryLabel}</strong>
          </p>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {operators.map((op) => (
              <OperatorBadge key={op.code} operator={op} />
            ))}
          </div>
        </section>

        <section className="sp-section-card" style={{ marginTop: 12 }}>
          <div className="sp-section-head">
            <h2>Actions</h2>
          </div>
          <div className="sp-action-stack" style={{ marginTop: 8 }}>
            <button className="sp-secondary-button" onClick={() => router.push("/wallet/deposit")}>
              Recharger
            </button>
            <button className="sp-secondary-button" onClick={() => router.push("/wallet/withdraw")}>
              Retirer
            </button>
            <button
              className="safepay-primary cyenoo-primary"
              style={{ gridColumn: "1 / -1" }}
              onClick={() => router.push("/transactions/new")}
            >
              Nouvelle transaction MM
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
