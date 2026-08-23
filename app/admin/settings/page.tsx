"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const base = { background: "#050b16", color: "#f1f6ff", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" };
const card: React.CSSProperties = { background: "#0a1424", border: "1px solid rgba(148,163,184,.13)", borderRadius: 16, padding: 20 };
const button: React.CSSProperties = { background: "#1677ff", color: "#fff", border: 0, borderRadius: 9, padding: "10px 14px", fontWeight: 800, cursor: "pointer" };

export default function AdminSettings() {
  const [theme, setTheme] = useState(() => typeof window === "undefined" ? "dark" : localStorage.getItem("safepay-admin-theme") || "dark");
  const [language, setLanguage] = useState(() => typeof window === "undefined" ? "fr" : localStorage.getItem("safepay-admin-language") || "fr");
  const [adminId, setAdminId] = useState("");
  const [role, setRole] = useState("admin");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function saveTheme(v: string) { setTheme(v); localStorage.setItem("safepay-admin-theme", v); }
  function saveLanguage(v: string) { setLanguage(v); localStorage.setItem("safepay-admin-language", v); }

  async function addAdmin() {
    if (!adminId) return;
    setBusy(true); setMessage("");
    const s = createClient();
    const gate = await s.rpc("is_admin");
    if (gate.error || !gate.data) { setMessage("Accès administrateur requis."); setBusy(false); return; }
    const r = await s.rpc("admin_manage_admin_users", { p_target_user_id: adminId, p_action: "add", p_role: role, p_reason: reason || "Ajout depuis le Dashboard Admin" });
    setMessage(r.error ? r.error.message : "Administrateur ajouté dans SafePay."); setBusy(false);
    if (!r.error) { setAdminId(""); setReason(""); }
  }

  return <main style={base}><div style={{ maxWidth: 1180, margin: "0 auto", padding: 28 }}>
    <a href="/admin" style={{ color: "#72b4ff", textDecoration: "none", fontSize: 13 }}>← Dashboard Admin</a>
    <header style={{ margin: "22px 0" }}><small style={{ color: "#6295cc", letterSpacing: ".15em", fontWeight: 800 }}>CONFIGURATION</small><h1 style={{ margin: "8px 0" }}>Paramètres du centre Admin</h1><p style={{ color: "#8094aa" }}>Préférences d'interface séparées des règles financières SafePay.</p></header>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 }}>
      <section style={card}><h2>Apparence</h2><p style={{ color: "#8094aa", fontSize: 13 }}>Choisis le thème de la console Admin. Cela ne modifie pas le thème de l'application client.</p><label style={{ display: "grid", gap: 7, marginTop: 18 }}>Thème<select value={theme} onChange={e => saveTheme(e.target.value)} style={select}><option value="dark">🌙 Sombre</option><option value="light">☀️ Clair</option><option value="system">Système</option></select></label></section>
      <section style={card}><h2>Langue</h2><p style={{ color: "#8094aa", fontSize: 13 }}>Préférence d'affichage du centre Admin.</p><label style={{ display: "grid", gap: 7, marginTop: 18 }}>Langue<select value={language} onChange={e => saveLanguage(e.target.value)} style={select}><option value="fr">🇫🇷 Français</option><option value="en">🇬🇧 English</option></select></label></section>
      <section style={{ ...card, gridColumn: "1 / -1" }}><h2>Administrateurs</h2><p style={{ color: "#8094aa", fontSize: 13 }}>Ajoute un utilisateur SafePay existant à <b>admin_users</b>. Aucun compte parallèle n'est créé.</p><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: 10, marginTop: 18 }}><input value={adminId} onChange={e => setAdminId(e.target.value)} placeholder="UUID du profil existant" style={input}/><select value={role} onChange={e => setRole(e.target.value)} style={input}><option value="admin">Admin</option><option value="super_admin">Super Admin</option><option value="support">Support</option></select><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Motif (audit)" style={input}/><button disabled={busy || !adminId} onClick={addAdmin} style={{ ...button, opacity: busy || !adminId ? .5 : 1 }}>{busy ? "Ajout…" : "Ajouter"}</button></div>{message && <p style={{ marginTop: 14, color: message.includes("erreur") || message.includes("required") ? "#ff9da8" : "#7cdda9" }}>{message}</p>}</section>
      <section style={{ ...card, gridColumn: "1 / -1" }}><h2>Règles financières</h2><p style={{ color: "#8094aa", fontSize: 13 }}>Les commissions, limites, frais, maintenance et feature flags restent dans Supabase et doivent être modifiés depuis le Dashboard Admin principal via les RPC sécurisées. Cette page ne crée pas de copie locale.</p><a href="/admin" style={{ ...button, display: "inline-block", textDecoration: "none", marginTop: 8 }}>Ouvrir les paramètres SafePay</a></section>
    </div>
  </div></main>;
}
const input: React.CSSProperties = { background: "#071222", color: "#e8f1ff", border: "1px solid rgba(148,163,184,.16)", borderRadius: 9, padding: "11px 12px", outline: "none" };
const select = { ...input };
