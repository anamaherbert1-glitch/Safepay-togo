"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [commissionPercent, setCommissionPercent] = useState(2);
  const [commissionFixed, setCommissionFixed] = useState(0);
  const [feePayer, setFeePayer] = useState("buyer");
  const [minimumFee, setMinimumFee] = useState(0);
  const [maximumFee, setMaximumFee] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("safepay_fee_settings")
      .select("commission_percent,commission_fixed,fee_payer,minimum_fee,maximum_fee,currency,version")
      .eq("active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setSetting(data);
    if (data) {
      setCommissionPercent(Number(data.commission_percent ?? 0));
      setCommissionFixed(Number(data.commission_fixed ?? 0));
      setFeePayer(String(data.fee_payer ?? "buyer"));
      setMinimumFee(Number(data.minimum_fee ?? 0));
      setMaximumFee(data.maximum_fee == null ? "" : String(data.maximum_fee));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("admin_update_financial_settings", {
      p_commission_percent: commissionPercent,
      p_commission_fixed: commissionFixed,
      p_fee_payer: feePayer,
      p_minimum_fee: minimumFee,
      p_maximum_fee: maximumFee === "" ? null : Number(maximumFee),
      p_currency: setting?.currency || "XOF",
      p_reason: reason.trim() || "Mise à jour depuis le Dashboard Admin",
    });

    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return;
    }

    setReason("");
    setMessage("Configuration enregistrée. Une nouvelle version financière a été créée.");
    await load();
    setSaving(false);
  }

  if (loading) {
    return (
      <section className="adm-panel">
        <h2>Finance &amp; Commissions</h2>
        <p>Chargement…</p>
      </section>
    );
  }

  if (error && !setting) {
    return (
      <section className="adm-panel">
        <h2>Finance &amp; Commissions</h2>
        <p>{error}</p>
      </section>
    );
  }

  const payerLabel = feePayer === "split" ? "50 / 50" : feePayer === "seller" ? "Vendeur" : "Acheteur";

  return (
    <section className="adm-settings">
      <div className="adm-section-intro">
        <div>
          <span>FINANCE</span>
          <h2>Commissions SafePay</h2>
          <p>
            Source unique : <b>safepay_fee_settings</b>. Les transactions utilisent le moteur backend et un snapshot financier immuable.
          </p>
        </div>
        <div className="adm-lock">Backend source of truth</div>
      </div>

      {error && <div className="adm-error">{error}</div>}
      {message && <div className="adm-toast">{message}</div>}

      <div className="adm-settings-grid">
        <div className="adm-setting"><div><span>Version active</span><p>{setting?.version ?? "—"}</p></div></div>
        <div className="adm-setting"><div><span>Devise</span><p>{setting?.currency || "XOF"}</p></div></div>
        <div className="adm-setting"><div><span>Payeur actuel</span><p>{payerLabel}</p></div></div>
      </div>

      <div className="adm-panel" style={{ marginTop: 16 }}>
        <div className="adm-panel-head">
          <div><span>CONFIGURATION</span><h3>Modifier les règles de commission</h3></div>
        </div>
        <div className="adm-settings-grid">
          <label className="adm-setting"><span>Commission (%)</span><input type="number" min="0" max="100" step="0.01" value={commissionPercent} onChange={(e) => setCommissionPercent(Number(e.target.value))} /></label>
          <label className="adm-setting"><span>Frais fixe (XOF)</span><input type="number" min="0" step="1" value={commissionFixed} onChange={(e) => setCommissionFixed(Number(e.target.value))} /></label>
          <label className="adm-setting"><span>Qui paie ?</span><select value={feePayer} onChange={(e) => setFeePayer(e.target.value)}><option value="buyer">Acheteur</option><option value="seller">Vendeur</option><option value="split">50 / 50</option></select></label>
          <label className="adm-setting"><span>Frais minimum (XOF)</span><input type="number" min="0" step="1" value={minimumFee} onChange={(e) => setMinimumFee(Number(e.target.value))} /></label>
          <label className="adm-setting"><span>Frais maximum (XOF)</span><input type="number" min="0" step="1" value={maximumFee} placeholder="Aucun" onChange={(e) => setMaximumFee(e.target.value)} /></label>
          <label className="adm-setting"><span>Motif de modification</span><input value={reason} placeholder="Ex. Ajustement tarifaire" onChange={(e) => setReason(e.target.value)} /></label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={() => void save()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer la nouvelle configuration"}</button>
        </div>
      </div>
    </section>
  );
}
