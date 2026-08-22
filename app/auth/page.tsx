"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

function GoogleMark() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.73-.07-1.43-.2-2.09H12v3.96h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.26Z"/><path fill="#34A853" d="M12 21.82c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53H3.3A9.74 9.74 0 0 0 12 21.82Z"/><path fill="#FBBC05" d="M6.54 13.91A5.86 5.86 0 0 1 6.23 12c0-.66.11-1.3.31-1.91V7.56H3.3A9.82 9.82 0 0 0 2.18 12c0 1.6.38 3.11 1.12 4.44l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.06c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.16 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.78 9.46 6.06 12 6.06Z"/></svg>;
}
function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden
    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 5.1A10.6 10.6 0 0 1 12 4.9c5 0 8.5 4.5 9.5 7.1a12 12 0 0 1-3.1 4.2"/><path d="M6.2 6.3C4.2 7.7 2.9 9.8 2.5 12c.6 1.5 2 3.7 4.4 5.2"/></svg>
    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.2-7 9.5-7 9.5 7 9.5 7-3.2 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.7"/></svg>;
}
function CheckIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>; }

type Step = "method" | "password" | "emailVerify" | "phone" | "otp" | "profile";
type NoticeKind = "info" | "success" | "error";

function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  return Promise.race([Promise.resolve(promise), new Promise<T>((_, reject) => setTimeout(() => reject(new Error("La demande prend trop de temps. Vérifiez votre connexion Internet puis réessayez.")), ms))]);
}

function friendlyAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("provider is not enabled") || text.includes("unsupported provider")) return "Google n’est pas encore activé dans Supabase. La configuration du fournisseur doit être terminée avant de pouvoir utiliser ce bouton.";
  if (text.includes("unsupported phone provider") || text.includes("phone provider") || text.includes("phone_provider_disabled") || text.includes("otp_disabled")) return "La vérification SMS n’est pas encore activée dans Supabase. Le numéro ne sera considéré comme vérifié qu’après un vrai OTP.";
  if (text.includes("user already registered") || text.includes("already registered")) return "Cette adresse email est déjà associée à un compte SafePay. Utilisez la connexion par téléphone pour retrouver votre compte.";
  if (text.includes("phone") && text.includes("already")) return "Ce numéro de téléphone est déjà associé à un compte SafePay. Utilisez la connexion par téléphone.";
  if (text.includes("rate limit") || text.includes("over_email_send_rate_limit")) return "Trop de demandes d’email ont été envoyées. Attendez quelques minutes avant de recommencer.";
  if (text.includes("invalid or has expired") || text.includes("one-time token not found")) return "Ce lien de vérification est expiré ou a déjà été utilisé. Demandez un nouvel email de vérification.";
  return message;
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="sp-password-field">{label}<span className="sp-password-wrap"><input required type={visible ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete}/><button type="button" className="sp-password-toggle" onClick={() => setVisible(v => !v)} aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}><EyeIcon hidden={!visible}/></button></span></label>;
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("method");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryCode, setCountryCode] = useState("TG");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "seller">("client");
  const [message, setMessage] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("info");
  const [busy, setBusy] = useState(false);
  const [oauthMode, setOauthMode] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const country = useMemo(() => SAFE_PAY_COUNTRIES.find(c => c.code === countryCode) ?? SAFE_PAY_COUNTRIES[0], [countryCode]);

  function notice(text: string, kind: NoticeKind = "info") { setMessage(text); setNoticeKind(kind); }
  function clearNotice() { setMessage(""); setNoticeKind("info"); }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let active = true;
    async function resume() {
      try {
        const errorParam = searchParams.get("error");
        if (errorParam) { notice(friendlyAuthError(errorParam), "error"); return; }
        const s = createClient();
        const { data: { user } } = await withTimeout(s.auth.getUser());
        if (!active || !user) return;
        setEmail(user.email || "");
        const oauth = searchParams.get("oauth") === "1";
        const emailVerified = searchParams.get("email") === "verified";
        if (oauth) {
          setOauthMode(true);
          const { data: profile } = await withTimeout(s.rpc("get_my_profile"));
          if (profile?.full_name && profile?.phone_verified && user.phone_confirmed_at) { router.replace("/dashboard"); return; }
          if (user.user_metadata?.full_name && user.phone_confirmed_at) { setStep("profile"); return; }
          setStep("password");
          notice("Compte Google connecté. Créez maintenant votre mot de passe SafePay, puis vérifiez votre téléphone.", "success");
          return;
        }
        if (emailVerified || user.email_confirmed_at) {
          if (user.phone_confirmed_at) {
            const { data: profile } = await withTimeout(s.rpc("get_my_profile"));
            if (profile?.full_name && profile?.phone_verified) { router.replace("/dashboard"); return; }
            setStep("profile");
          } else {
            setStep("phone");
            notice("Adresse email vérifiée. Étape suivante : vérification du téléphone par OTP.", "success");
          }
        }
      } catch (err) {
        if (active) notice(err instanceof Error ? err.message : "Impossible de reprendre l’inscription.", "error");
      }
    }
    resume();
    return () => { active = false; };
  }, [searchParams, router]);

  function back() {
    const previous: Record<Step, Step> = { method: "method", password: "method", emailVerify: "password", phone: "emailVerify", otp: "phone", profile: "otp" };
    clearNotice();
    setStep(previous[step]);
  }

  async function continueWithGoogle() {
    setBusy(true); clearNotice();
    try {
      const redirectTo = `${window.location.origin}/auth/callback?oauth=1`;
      const { error } = await withTimeout(createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo, queryParams: { prompt: "select_account" } } }));
      if (error) notice(friendlyAuthError(error.message), "error");
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible d’ouvrir Google."), "error"); }
    finally { setBusy(false); }
  }

  function submitEmail(e: FormEvent) {
    e.preventDefault(); clearNotice();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) { notice("Entrez une adresse email valide.", "error"); return; }
    setEmail(normalized); setStep("password");
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault(); clearNotice();
    if (password.length < 8) { notice("Le mot de passe doit contenir au moins 8 caractères.", "error"); return; }
    if (password !== confirm) { notice("Les deux mots de passe ne correspondent pas.", "error"); return; }
    setBusy(true);
    try {
      const s = createClient();
      const result = oauthMode
        ? await withTimeout(s.auth.updateUser({ password }))
        : await withTimeout(s.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?email=verified` } }));
      if (result.error) { notice(friendlyAuthError(result.error.message), "error"); return; }
      setPassword(""); setConfirm("");
      if (oauthMode) {
        setStep("phone"); notice("Mot de passe SafePay créé. Étape suivante : vérification du téléphone par OTP.", "success"); return;
      }
      const hasSession = "session" in result.data && !!result.data.session;
      const confirmed = !!result.data.user?.email_confirmed_at;
      if (hasSession || confirmed) {
        setStep("phone"); notice("Compte créé. Étape suivante : vérification du téléphone par OTP.", "success");
      } else {
        setStep("emailVerify"); notice("Compte créé. Un email de vérification a été envoyé. Ouvrez-le puis revenez sur SafePay.", "success");
      }
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible de créer le compte."), "error"); }
    finally { setBusy(false); }
  }

  async function resendEmail() {
    if (!email || resendCooldown > 0 || resendBusy) return;
    setResendBusy(true); clearNotice();
    try {
      const { error } = await withTimeout(createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?email=verified` } }));
      if (error) { notice(friendlyAuthError(error.message), "error"); return; }
      setResendCooldown(60); notice("Un nouvel email de vérification a été envoyé.", "success");
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible de renvoyer l’email."), "error"); }
    finally { setResendBusy(false); }
  }

  async function confirmEmailVerification() {
    setBusy(true); clearNotice();
    try {
      const { data: { user }, error } = await withTimeout(createClient().auth.getUser());
      if (error || !user) { notice("Session non disponible. Ouvrez le lien reçu par email puis revenez ici.", "error"); return; }
      if (!user.email_confirmed_at) { notice("Votre adresse email n’est pas encore vérifiée. Cliquez d’abord sur le lien reçu.", "error"); return; }
      setEmail(user.email ?? email); setStep("phone"); notice("✓ Adresse email vérifiée. Vous pouvez maintenant vérifier votre numéro de téléphone.", "success");
    } catch (err) { notice(err instanceof Error ? err.message : "Impossible de vérifier l’email.", "error"); }
    finally { setBusy(false); }
  }

  async function submitPhone(e: FormEvent) {
    e.preventDefault(); clearNotice();
    const r = validatePhone(country.code, phoneLocal);
    if (!r.valid) { notice(r.reason, "error"); return; }
    setBusy(true);
    try {
      const s = createClient();
      const { data: { user } } = await withTimeout(s.auth.getUser());
      if (!user) { notice("Session expirée. Reconnectez-vous.", "error"); return; }
      const { error } = await withTimeout(s.auth.updateUser({ phone: r.e164 }));
      if (error) { notice(friendlyAuthError(error.message), "error"); return; }
      setPhoneE164(r.e164); setOtp(""); setStep("otp"); notice("Code de vérification envoyé par SMS. Entrez le code reçu pour continuer.", "success");
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible d’envoyer le code OTP."), "error"); }
    finally { setBusy(false); }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault(); clearNotice();
    if (!/^\d{6}$/.test(otp)) { notice("Entrez le code à 6 chiffres reçu par SMS.", "error"); return; }
    setBusy(true);
    try {
      const s = createClient();
      const { error } = await withTimeout(s.auth.verifyOtp({ phone: phoneE164, token: otp, type: "phone_change" }));
      if (error) { notice(friendlyAuthError(error.message), "error"); return; }
      const { data: { user } } = await withTimeout(s.auth.getUser());
      if (!user?.phone_confirmed_at) { notice("Le numéro n’est pas encore confirmé.", "error"); return; }
      setStep("profile"); notice("✓ Téléphone vérifié. Dernière étape : compléter votre profil SafePay.", "success");
    } catch (err) { notice(friendlyAuthError(err instanceof Error ? err.message : "Impossible de vérifier le code."), "error"); }
    finally { setBusy(false); }
  }

  async function submitProfile(e: FormEvent) {
    e.preventDefault(); clearNotice();
    const name = fullName.trim();
    if (!/^[\p{L}][\p{L}\s'’-]{1,79}$/u.test(name)) { notice("Le nom complet doit contenir uniquement des lettres et des espaces.", "error"); return; }
    setBusy(true);
    try {
      const s = createClient();
      const { error: metaError } = await withTimeout(s.auth.updateUser({ data: { full_name: name, country: countryCode, role } }));
      if (metaError) throw metaError;
      const { data, error } = await withTimeout(s.rpc("bootstrap_user_account", { p_role: role }));
      if (error) throw error;
      if (!data?.onboarding_complete) throw new Error("Le compte n’a pas pu être finalisé.");
      router.replace("/dashboard");
    } catch (err) { notice(err instanceof Error ? err.message : "Impossible de finaliser le compte.", "error"); }
    finally { setBusy(false); }
  }

  const title = step === "method" ? "Créer votre compte SafePay" : step === "password" ? "Créer votre mot de passe" : step === "emailVerify" ? "Vérifier votre email" : step === "phone" ? "Votre numéro de téléphone" : step === "otp" ? "Vérifier votre téléphone" : "Votre profil";

  return <main className="safepay-shell auth-screen">
    <header className="auth-header">{step !== "method" ? <button className="safepay-icon" onClick={back} aria-label="Retour">←</button> : <span/>}<strong>SafePay</strong><span/></header>
    <section className="auth-content"><div className="safepay-card auth-card">
      <div className="auth-kicker">SafePay V5</div><h1>{title}</h1>
      {step === "method" && <>
        <p className="sp-muted">L’inscription commence obligatoirement par l’email ou Google.</p>
        <button type="button" disabled={busy} onClick={continueWithGoogle} className="sp-google-button"><GoogleMark/>Continuer avec Google</button>
        <div className="auth-divider">ou</div>
        <form onSubmit={submitEmail} className="sp-form"><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email"/></label><button className="safepay-primary" disabled={busy}>Continuer</button></form>
      </>}
      {step === "password" && <form onSubmit={submitPassword} className="sp-form"><p className="sp-muted">Compte : {email}</p><PasswordField label="Mot de passe" value={password} onChange={setPassword} autoComplete="new-password"/><PasswordField label="Confirmer" value={confirm} onChange={setConfirm} autoComplete="new-password"/><small className="sp-muted">Minimum 8 caractères.</small><button className="safepay-primary" disabled={busy}>{busy ? "Création…" : "Créer le compte"}</button></form>}
      {step === "emailVerify" && <div className="sp-form"><div className="sp-verification-success"><span><CheckIcon/></span><strong>Compte créé</strong><p>Vérifiez votre boîte email. Le lien de confirmation vous ramènera automatiquement vers SafePay.</p></div><button type="button" className="safepay-primary" onClick={confirmEmailVerification} disabled={busy}>{busy ? "Vérification…" : "J’ai vérifié mon email"}</button><button type="button" className="sp-secondary-button" onClick={resendEmail} disabled={resendBusy || resendCooldown > 0}>{resendBusy ? "Envoi…" : resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer l’email"}</button></div>}
      {step === "phone" && <form onSubmit={submitPhone} className="sp-form"><label>Numéro de téléphone<div className="phone-row"><select value={countryCode} onChange={e => setCountryCode(e.target.value)} aria-label="Pays">{SAFE_PAY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.callingCode}</option>)}</select><input value={phoneLocal} onChange={e => setPhoneLocal(onlyPhoneCharacters(e.target.value))} placeholder="90 XX XX XX" inputMode="tel" autoComplete="tel" required/></div></label><div className="phone-country-meta">{country.flag} {country.callingCode} · {country.name} · {country.currency}</div><button className="safepay-primary" disabled={busy}>{busy ? "Envoi…" : "Envoyer le code"}</button></form>}
      {step === "otp" && <form onSubmit={submitOtp} className="sp-form"><p className="sp-muted">Un code à 6 chiffres a été envoyé à <strong>{phoneE164}</strong>.</p><label>Code OTP<input required inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoComplete="one-time-code"/></label><button className="safepay-primary" disabled={busy}>{busy ? "Vérification…" : "Vérifier le numéro"}</button></form>}
      {step === "profile" && <form onSubmit={submitProfile} className="sp-form"><p className="sp-muted">Téléphone vérifié : {phoneE164 || "votre numéro vérifié"}</p><label>Nom complet<input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nom et prénom" autoComplete="name"/></label><div className="role-choice"><button type="button" className={role === "client" ? "selected" : ""} onClick={() => setRole("client")}>Client<span>Acheter / payer</span></button><button type="button" className={role === "seller" ? "selected" : ""} onClick={() => setRole("seller")}>Vendeur<span>Recevoir / vendre</span></button></div><button className="safepay-primary" disabled={busy}>{busy ? "Finalisation…" : "Accéder à SafePay"}</button></form>}
      {message && <p className={`sp-form-message sp-form-message-${noticeKind}`} role={noticeKind === "error" ? "alert" : "status"}>{message}</p>}
    </div></section>
  </main>;
}

export default function AuthPage() { return <Suspense fallback={<main className="safepay-shell auth-screen"><div className="sp-page-loading"><span className="sp-loader"/>Chargement…</div></main>}><AuthPageContent/></Suspense>; }
