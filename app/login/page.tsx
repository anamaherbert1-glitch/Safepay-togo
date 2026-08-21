"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() { return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.73-.07-1.43-.2-2.09H12v3.96h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.26Z"/><path fill="#34A853" d="M12 21.82c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.82Z"/><path fill="#FBBC05" d="M6.54 13.91A5.86 5.86 0 0 1 6.23 12c0-.66.11-1.3.31-1.91V7.56H3.3A9.82 9.82 0 0 0 2.18 12c0 1.6.38 3.11 1.12 4.44l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.06c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.16 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.78 9.46 6.06 12 6.06Z"/></svg>; }

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function finishLogin() {
    const s = createClient();
    const { data, error: bootstrapError } = await s.rpc("bootstrap_user_account");
    if (bootstrapError && bootstrapError.message !== "email_not_verified" && bootstrapError.message !== "phone_not_verified") throw bootstrapError;
    if (data?.onboarding_complete) router.replace("/dashboard");
    else router.replace("/dashboard");
  }

  async function emailLogin(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    const s = createClient();
    const { error: loginError } = await s.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError) { setBusy(false); setError(loginError.message); return; }
    try { await finishLogin(); } catch (err) { await s.auth.signOut(); setError(err instanceof Error ? err.message : "Impossible de charger votre compte."); setBusy(false); }
  }

  async function googleLogin() {
    setError(""); setBusy(true);
    const s = createClient();
    const { error: oauthError } = await s.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?oauth=login` } });
    if (oauthError) { setBusy(false); setError(oauthError.message); }
  }

  async function sendPhoneOtp(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    const normalized = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setBusy(false); setError("Entrez le numéro au format international, par exemple +22890000000."); return; }
    const s = createClient();
    const { error: otpError } = await s.auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (otpError) { setError(otpError.message); return; }
    setOtpSent(true);
  }

  async function verifyPhoneOtp(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    const s = createClient();
    const { error: verifyError } = await s.auth.verifyOtp({ phone: phone.trim(), token: otp, type: "sms" });
    if (verifyError) { setBusy(false); setError(verifyError.message); return; }
    try { await finishLogin(); } catch (err) { setError(err instanceof Error ? err.message : "Impossible de charger votre compte."); setBusy(false); }
  }

  return <main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}><header style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}><button className="safepay-icon" onClick={() => router.back()} aria-label="Retour">←</button><strong style={{ fontSize: 21 }}>SafePay</strong></header><section style={{ paddingTop: 28 }}><div className="safepay-card" style={{ padding: 22 }}><div style={{ color: "var(--sp-muted)", fontSize: 13 }}>SafePay V5</div><h1 style={{ margin: "8px 0" }}>Se connecter</h1><button disabled={busy} onClick={googleLogin} style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid var(--sp-line)", background: "#fff", display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}><GoogleMark /> Continuer avec Google</button><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "18px 0" }}><button className={method === "email" ? "safepay-primary" : "sp-secondary-button"} onClick={() => { setMethod("email"); setError(""); }}>Email</button><button className={method === "phone" ? "safepay-primary" : "sp-secondary-button"} onClick={() => { setMethod("phone"); setError(""); }}>Téléphone</button></div>
{method === "email" && <form onSubmit={emailLogin} className="sp-form"><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" /></label><label>Mot de passe<input required type="password" value={password} onChange={e => setPassword(e.target.value)} /></label><button className="safepay-primary" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button></form>}
{method === "phone" && <form onSubmit={otpSent ? verifyPhoneOtp : sendPhoneOtp} className="sp-form"><label>Numéro de téléphone<input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+22890000000" inputMode="tel" /></label>{otpSent && <label>Code OTP<input required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} inputMode="numeric" placeholder="000000" /></label>}<button className="safepay-primary" disabled={busy}>{busy ? "Vérification…" : otpSent ? "Vérifier le code" : "Envoyer le code"}</button></form>}
{error && <p className="sp-form-error" role="alert">{error}</p>}<p style={{ marginTop: 18, color: "var(--sp-muted)", fontSize: 13 }}>Pas encore de compte ? <button style={{ border: 0, background: "transparent", color: "var(--sp-primary)", fontWeight: 800, padding: 0 }} onClick={() => router.push("/auth")}>Créer un compte</button></p></div></section></main>;
}
