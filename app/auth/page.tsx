"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

function GoogleMark() { return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.73-.07-1.43-.2-2.09H12v3.96h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.26Z"/><path fill="#34A853" d="M12 21.82c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53H3.3A9.74 9.74 0 0 0 12 21.82Z"/><path fill="#FBBC05" d="M6.54 13.91A5.86 5.86 0 0 1 6.23 12c0-.66.11-1.3.31-1.91V7.56H3.3A9.82 9.82 0 0 0 2.18 12c0 1.6.38 3.11 1.12 4.44l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.06c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.16 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.78 9.46 6.06 12 6.06Z"/></svg>; }
type Step = "method" | "password" | "emailVerify" | "phone" | "otp" | "profile";

function friendlyAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("provider is not enabled") || text.includes("google")) return "Google n’est pas encore activé dans le projet Supabase. L’interface est prête, mais le fournisseur Google doit être activé dans Supabase avant de pouvoir l’utiliser.";
  if (text.includes("unsupported phone provider") || text.includes("phone provider") || text.includes("phone_provider_disabled")) return "La vérification SMS n’est pas encore activée dans Supabase. Le numéro est bien validé côté SafePay, mais le fournisseur SMS Auth doit être configuré avant l’envoi réel du code.";
  if (text.includes("user already registered") || text.includes("already registered")) return "Cette adresse email est déjà associée à un compte SafePay. Utilisez la connexion par téléphone ou récupérez votre compte existant.";
  return message;
}

function withTimeout<T>(promise: PromiseLike<T>, ms = 20000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("La demande prend trop de temps. Vérifiez votre connexion Internet puis réessayez.")), ms)),
  ]);
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
  const [busy, setBusy] = useState(false);
  const [oauthMode, setOauthMode] = useState(false);
  const country = useMemo(() => SAFE_PAY_COUNTRIES.find(c => c.code === countryCode) ?? SAFE_PAY_COUNTRIES[0], [countryCode]);

  useEffect(() => {
    let active = true;
    async function resumeAuth() {
      const errorParam = searchParams.get("error");
      if (errorParam) { setMessage(friendlyAuthError(errorParam)); return; }
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!active || !user) return;
      setEmail(user.email || "");
      const oauth = searchParams.get("oauth") === "1";
      const emailVerified = searchParams.get("email") === "verified";
      if (oauth) { setOauthMode(true); setStep("password"); setMessage("Compte Google connecté. Créez maintenant votre mot de passe SafePay."); return; }
      if (emailVerified || user.email_confirmed_at) {
        if (user.phone_confirmed_at) {
          const { data: profile } = await s.rpc("get_my_profile");
          if (profile?.full_name && profile?.phone_verified) router.replace("/dashboard");
          else setStep("profile");
        } else {
          setStep("phone");
          setMessage("Adresse email vérifiée. Vous pouvez maintenant vérifier votre téléphone.");
        }
      }
    }
    resumeAuth();
    return () => { active = false; };
  }, [searchParams, router]);

  function back() {
    const previous: Record<Step, Step> = { method: "method", password: "method", emailVerify: "password", phone: "emailVerify", otp: "phone", profile: "otp" };
    setMessage(""); setStep(previous[step]);
  }

  async function continueWithGoogle() {
    setBusy(true); setMessage("Ouverture de Google…");
    const s = createClient();
    try {
      const { error } = await withTimeout(s.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?oauth=1`, queryParams: { prompt: "select_account" } } }));
      if (error) setMessage(friendlyAuthError(error.message));
    } catch (err) { setMessage(friendlyAuthError(err instanceof Error ? err.message : "Impossible d’ouvrir Google.")); }
    finally { setBusy(false); }
  }

  function submitEmail(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMessage("Entrez une adresse email valide."); return; }
    setEmail(email.trim()); setStep("password");
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (password.length < 8) { setMessage("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setMessage("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true); setMessage("Création sécurisée de votre compte…");
    const s = createClient();
    try {
      const result = oauthMode ? await withTimeout(s.auth.updateUser({ password })) : await withTimeout(s.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?email=verified` } }));
      if (result.error) { setMessage(friendlyAuthError(result.error.message)); return; }
      if (oauthMode) { setPassword(""); setConfirm(""); setStep("phone"); setMessage("Mot de passe SafePay créé. Étape suivante : vérification du téléphone par OTP."); return; }
      setPassword(""); setConfirm("");
      if (result.data?.user?.email_confirmed_at) { setStep("phone"); setMessage("Email confirmé. Étape suivante : vérification du téléphone par OTP."); }
      else { setStep("emailVerify"); setMessage("Un email de vérification a été envoyé. Vous devez confirmer votre adresse avant de continuer."); }
    } catch (err) { setMessage(friendlyAuthError(err instanceof Error ? err.message : "Impossible de créer le compte.")); }
    finally { setBusy(false); }
  }

  async function confirmEmailVerification() {
    setBusy(true); setMessage("Vérification de votre session…");
    const s = createClient();
    const { data: { user }, error } = await withTimeout(s.auth.getUser());
    setBusy(false);
    if (error || !user) return setMessage("Session non disponible. Ouvrez le lien reçu par email puis revenez ici.");
    if (!user.email_confirmed_at) return setMessage("Votre adresse email n’est pas encore vérifiée.");
    setEmail(user.email ?? email); setStep("phone"); setMessage("Email vérifié. Étape suivante : votre numéro de téléphone.");
  }

  async function submitPhone(e: FormEvent) {
    e.preventDefault(); setMessage("");
    const r = validatePhone(country.code, phoneLocal);
    if (!r.valid) { setMessage(r.reason); return; }
    setBusy(true); setMessage("Vérification du numéro et préparation du code OTP…");
    const s = createClient();
    try {
      const { data: { user } } = await withTimeout(s.auth.getUser());
      if (!user) { setMessage("Session expirée. Reconnectez-vous."); return; }
      const { error } = await withTimeout(s.auth.updateUser({ phone: r.e164 }));
      if (error) { setMessage(friendlyAuthError(error.message)); return; }
      setPhoneE164(r.e164); setOtp(""); setStep("otp"); setMessage("Code de vérification envoyé par SMS.");
    } catch (err) { setMessage(friendlyAuthError(err instanceof Error ? err.message : "Impossible d’envoyer le code OTP.")); }
    finally { setBusy(false); }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!/^\d{6}$/.test(otp)) { setMessage("Entrez le code à 6 chiffres reçu par SMS."); return; }
    setBusy(true); setMessage("Vérification du code OTP…");
    const s = createClient();
    try {
      const { error } = await withTimeout(s.auth.verifyOtp({ phone: phoneE164, token: otp, type: "phone_change" }));
      if (error) { setMessage(friendlyAuthError(error.message)); return; }
      const { data: { user } } = await withTimeout(s.auth.getUser());
      if (!user?.phone_confirmed_at) { setMessage("Le numéro n’est pas encore confirmé."); return; }
      setStep("profile"); setMessage("Téléphone vérifié. Vous pouvez maintenant créer votre profil SafePay.");
    } catch (err) { setMessage(friendlyAuthError(err instanceof Error ? err.message : "Impossible de vérifier le code.")); }
    finally { setBusy(false); }
  }

  async function submitProfile(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!/^[\p{L}][\p{L}\s'’-]{1,79}$/u.test(fullName.trim())) { setMessage("Le nom complet doit contenir uniquement des caractères alphabétiques et des espaces."); return; }
    setBusy(true); setMessage("Finalisation sécurisée de votre compte…");
    const s = createClient();
    try {
      const { error: metaError } = await withTimeout(s.auth.updateUser({ data: { full_name: fullName.trim(), country: countryCode, role } }));
      if (metaError) throw metaError;
      const { data, error } = await withTimeout(s.rpc("bootstrap_user_account", { p_role: role }));
      if (error) throw error;
      if (!data?.onboarding_complete) throw new Error("Le compte n’a pas pu être finalisé.");
      router.replace("/dashboard");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Impossible de finaliser le compte."); }
    finally { setBusy(false); }
  }

  const title = step === "method" ? "Créer votre compte SafePay" : step === "password" ? "Créer votre mot de passe" : step === "emailVerify" ? "Vérifier votre email" : step === "phone" ? "Votre numéro de téléphone" : step === "otp" ? "Vérifier votre téléphone" : "Votre profil";

  return <main className="safepay-shell auth-screen"><header className="auth-header">{step !== "method" && <button className="safepay-icon" onClick={back} aria-label="Retour">←</button>}<strong>SafePay</strong></header><section className="auth-content"><div className="safepay-card auth-card"><div className="auth-kicker">SafePay V5</div><h1>{title}</h1>
  {step === "method" && <><p className="sp-muted">L’inscription commence obligatoirement par l’email ou Google.</p><button disabled={busy} onClick={continueWithGoogle} className="sp-google-button"><GoogleMark/>Continuer avec Google</button><div className="auth-divider">ou</div><form onSubmit={submitEmail} className="sp-form"><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email"/></label><button className="safepay-primary" disabled={busy}>Continuer</button></form></>}
  {step === "password" && <form onSubmit={submitPassword} className="sp-form"><p className="sp-muted">Compte : {email}</p><label>Mot de passe<input required type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"/></label><label>Confirmer<input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"/></label><button className="safepay-primary" disabled={busy}>{busy ? "Création…" : "Créer le compte"}</button></form>}
  {step === "emailVerify" && <div><p>Vérifiez votre boîte email et cliquez sur le lien envoyé par Supabase. Vous devez terminer cette étape avant de passer au téléphone.</p><button className="safepay-primary" onClick={confirmEmailVerification} disabled={busy}>{busy ? "Vérification…" : "J’ai vérifié mon email"}</button></div>}
  {step === "phone" && <form onSubmit={submitPhone} className="sp-form"><label>Numéro de téléphone<div className="phone-row"><select value={countryCode} onChange={e => setCountryCode(e.target.value)} aria-label="Pays">{SAFE_PAY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.callingCode}</option>)}</select><input value={phoneLocal} onChange={e => setPhoneLocal(onlyPhoneCharacters(e.target.value))} placeholder="90 XX XX XX" inputMode="tel" autoComplete="tel" required/></div></label><div className="phone-country-meta">{country.flag} {country.callingCode} · {country.name} · {country.currency}</div><button className="safepay-primary" disabled={busy}>{busy ? "Envoi…" : "Envoyer le code"}</button></form>}
  {step === "otp" && <form onSubmit={submitOtp} className="sp-form"><p>Un code à 6 chiffres a été envoyé à {phoneE164}.</p><input required inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoComplete="one-time-code"/><button className="safepay-primary" disabled={busy}>{busy ? "Vérification…" : "Vérifier le numéro"}</button></form>}
  {step === "profile" && <form onSubmit={submitProfile} className="sp-form"><p className="sp-muted">Téléphone vérifié : {phoneE164 || "votre numéro vérifié"}</p><label>Nom complet<input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nom et prénom" autoComplete="name"/></label><label>Type de compte<select value={role} onChange={e => setRole(e.target.value as "client" | "seller")}><option value="client">Client</option><option value="seller">Vendeur</option></select></label><button className="safepay-primary" disabled={busy}>{busy ? "Finalisation…" : "Finaliser mon compte"}</button></form>}
  {message && <p className="sp-form-error" role="status">{message}</p>}
</div></section></main>;
}

export default function AuthPage() { return <Suspense fallback={<main className="safepay-shell auth-screen"><div className="sp-page-loading"><span className="sp-loader"/>Chargement…</div></main>}><AuthPageContent/></Suspense>; }
