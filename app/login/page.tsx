"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

type NoticeKind = "info" | "success" | "error";

function friendlyAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("unsupported phone provider") || text.includes("phone provider") || text.includes("phone_provider_disabled") || text.includes("otp_disabled")) return "La vérification SMS n’est pas encore activée dans Supabase. Le fournisseur SMS doit être configuré avant la connexion par téléphone.";
  if (text.includes("provider is not enabled")) return "Le fournisseur d’authentification demandé n’est pas encore activé dans Supabase.";
  if (text.includes("rate limit")) return "Trop de demandes ont été envoyées. Attendez quelques minutes puis réessayez.";
  return message;
}

function withTimeout<T>(promise: PromiseLike<T>, ms = 20000): Promise<T> {
  return Promise.race([Promise.resolve(promise), new Promise<T>((_, reject) => setTimeout(() => reject(new Error("La demande prend trop de temps. Vérifiez votre connexion Internet puis réessayez.")), ms))]);
}

export default function LoginPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("TG");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("info");
  const country = SAFE_PAY_COUNTRIES.find(c => c.code === countryCode) ?? SAFE_PAY_COUNTRIES[0];

  function notice(text: string, kind: NoticeKind = "info") { setMessage(text); setNoticeKind(kind); }
  function clearNotice() { setMessage(""); setNoticeKind("info"); }

  async function sendPhoneOtp(e: FormEvent) {
    e.preventDefault(); clearNotice();
    const result = validatePhone(country.code, phoneLocal);
    if (!result.valid) { notice(result.reason, "error"); return; }
    setBusy(true);
    try {
      const s = createClient();
      const { error: otpError } = await withTimeout(s.auth.signInWithOtp({ phone: result.e164, options: { shouldCreateUser: false } }));
      if (otpError) { notice(friendlyAuthError(otpError.message), "error"); return; }
      setPhoneE164(result.e164); setOtp(""); setOtpSent(true); notice("Code OTP envoyé. Entrez-le pour accéder à votre compte.", "success");
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible d’envoyer le code OTP."), "error"); }
    finally { setBusy(false); }
  }

  async function verifyPhoneOtp(e: FormEvent) {
    e.preventDefault(); clearNotice();
    if (!/^\d{6}$/.test(otp)) { notice("Entrez le code OTP à 6 chiffres.", "error"); return; }
    setBusy(true);
    try {
      const s = createClient();
      const { error: verifyError } = await withTimeout(s.auth.verifyOtp({ phone: phoneE164, token: otp, type: "sms" }));
      if (verifyError) { notice(friendlyAuthError(verifyError.message), "error"); return; }
      const { data: { user } } = await withTimeout(s.auth.getUser());
      if (!user?.phone_confirmed_at) { notice("Le numéro n’est pas confirmé.", "error"); return; }
      const { data, error: bootstrapError } = await withTimeout(s.rpc("bootstrap_user_account"));
      if (bootstrapError || !data?.onboarding_complete) {
        await s.auth.signOut();
        notice("Ce compte n’a pas terminé son inscription. SafePay ne donne pas accès au tableau de bord tant que l’email, le téléphone et le profil ne sont pas finalisés.", "error");
        return;
      }
      router.replace("/dashboard");
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible de vérifier le code."), "error"); }
    finally { setBusy(false); }
  }

  return <main className="safepay-shell auth-screen"><header className="auth-header"><button className="safepay-icon" onClick={() => router.replace("/")} aria-label="Retour">←</button><strong>SafePay</strong><span/></header><section className="auth-content"><div className="safepay-card auth-card"><div className="auth-kicker">SafePay V5</div><h1>Se connecter</h1><p className="sp-muted">La connexion SafePay se fait par numéro de téléphone + OTP. Aucun mot de passe email n’est demandé ici.</p>
    <form onSubmit={otpSent ? verifyPhoneOtp : sendPhoneOtp} className="sp-form"><label>Numéro de téléphone<div className="phone-row"><select value={countryCode} onChange={e => { setCountryCode(e.target.value); setOtpSent(false); setOtp(""); clearNotice(); }} aria-label="Pays">{SAFE_PAY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.callingCode}</option>)}</select><input value={phoneLocal} onChange={e => setPhoneLocal(onlyPhoneCharacters(e.target.value))} placeholder="90 XX XX XX" inputMode="tel" autoComplete="tel" required /></div></label><div className="phone-country-meta">{country.flag} {country.callingCode} · {country.name} · {country.currency}</div>{otpSent && <label>Code OTP<input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required /></label>}<button className="safepay-primary" disabled={busy}>{busy ? (otpSent ? "Vérification…" : "Envoi…") : (otpSent ? "Vérifier le code" : "Envoyer le code")}</button></form>
    {message && <p className={`sp-form-message sp-form-message-${noticeKind}`} role={noticeKind === "error" ? "alert" : "status"}>{message}</p>}
    <p className="auth-footer">Pas encore de compte ? <button type="button" onClick={() => router.push("/auth")}>Créer un compte</button></p>
  </div></section></main>;
}
