"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

function GoogleMark() { return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.73-.07-1.43-.2-2.09H12v3.96h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.26Z"/><path fill="#34A853" d="M12 21.82c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.82Z"/><path fill="#FBBC05" d="M6.54 13.91A5.86 5.86 0 0 1 6.23 12c0-.66.11-1.3.31-1.91V7.56H3.3A9.82 9.82 0 0 0 2.18 12c0 1.6.38 3.11 1.12 4.44l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.06c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.16 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.78 9.46 6.06 12 6.06Z"/></svg>; }
type Step = "method" | "password" | "emailVerify" | "phone" | "otp" | "profile";

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
      if (searchParams.get("error")) { setMessage(searchParams.get("error") || "Échec de l’authentification."); return; }
      const emailVerified = searchParams.get("email") === "verified";
      const oauth = searchParams.get("oauth") === "1";
      if (!emailVerified && !oauth) return;
      const s = createClient();
      const { data: { user }, error } = await s.auth.getUser();
      if (!active) return;
      if (error || !user) { setMessage(error?.message || "La session n’a pas pu être récupérée."); return; }
      setEmail(user.email || "");
      if (oauth) { setOauthMode(true); setStep("password"); setMessage("Compte Google connecté. Créez maintenant votre mot de passe SafePay."); return; }
      if (user.email_confirmed_at) { setStep("phone"); setMessage("Adresse email vérifiée. Vous pouvez maintenant vérifier votre téléphone."); }
    }
    resumeAuth();
    return () => { active = false; };
  }, [searchParams]);

  function back() {
    const previous: Record<Step, Step> = { method: "method", password: "method", emailVerify: "password", phone: "emailVerify", otp: "phone", profile: "otp" };
    setMessage(""); setStep(previous[step]);
  }

  async function continueWithGoogle() {
    setBusy(true); setMessage("");
    const s = createClient();
    const { error } = await s.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?oauth=1` } });
    if (error) { setMessage(error.message); setBusy(false); }
  }

  async function submitEmail(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email)) { setMessage("Entrez une adresse email valide."); return; }
    setStep("password");
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (password.length < 8) { setMessage("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setMessage("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const s = createClient();
    const result = oauthMode ? await s.auth.updateUser({ password }) : await s.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?email=verified` } });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    setStep(oauthMode ? "phone" : "emailVerify");
    setMessage(oauthMode ? "Mot de passe SafePay créé. Vérifiez maintenant votre téléphone." : "Un email de vérification a été envoyé. Ouvrez-le pour continuer.");
  }

  async function confirmEmailVerification() {
    setBusy(true); setMessage("");
    const s = createClient();
    const { data: { user }, error } = await s.auth.getUser();
    setBusy(false);
    if (error || !user) return setMessage("Session non disponible. Ouvrez le lien reçu par email puis revenez ici.");
    if (!user.email_confirmed_at) return setMessage("Votre adresse email n’est pas encore vérifiée.");
    setEmail(user.email ?? email); setStep("phone");
  }

  async function submitPhone(e: FormEvent) {
    e.preventDefault(); setMessage("");
    const r = validatePhone(country.code, phoneLocal);
    if (!r.valid) { setMessage(r.reason); return; }
    setBusy(true);
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { setBusy(false); setMessage("Session expirée. Reconnectez-vous."); return; }
    const { error } = await s.auth.updateUser({ phone: r.e164 });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setPhoneE164(r.e164); setOtp(""); setStep("otp"); setMessage("Code de vérification envoyé par SMS. Il doit être confirmé par Supabase Auth.");
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!/^\d{6}$/.test(otp)) { setMessage("Entrez le code à 6 chiffres reçu par SMS."); return; }
    setBusy(true);
    const s = createClient();
    const { error } = await s.auth.verifyOtp({ phone: phoneE164, token: otp, type: "phone_change" });
    if (error) { setBusy(false); setMessage(error.message); return; }
    const { data: { user } } = await s.auth.getUser();
    setBusy(false);
    if (!user?.phone_confirmed_at) { setMessage("Le numéro n’est pas encore confirmé."); return; }
    setStep("profile"); setMessage("Téléphone vérifié. Vous pouvez maintenant créer votre profil SafePay.");
  }

  async function submitProfile(e: FormEvent) {
    e.preventDefault(); setMessage("");
    if (!/^[\p{L}][\p{L}\s'’-]{1,79}$/u.test(fullName.trim())) { setMessage("Le nom complet doit contenir uniquement des caractères alphabétiques et des espaces."); return; }
    setBusy(true);
    const s = createClient();
    const { error: metaError } = await s.auth.updateUser({ data: { full_name: fullName.trim(), country: countryCode, role } });
    if (metaError) { setBusy(false); setMessage(metaError.message); return; }
    const { data, error } = await s.rpc("bootstrap_user_account", { p_role: role });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (!data?.onboarding_complete) { setMessage("Le compte n’a pas pu être finalisé."); return; }
    router.replace("/dashboard");
  }

  const title = step === "method" ? "Créer votre compte SafePay" : step === "password" ? "Créer votre mot de passe" : step === "emailVerify" ? "Vérifier votre email" : step === "phone" ? "Votre numéro de téléphone" : step === "otp" ? "Vérifier votre téléphone" : "Votre profil";

  return <main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}><header style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>{step !== "method" && <button className="safepay-icon" onClick={back} aria-label="Retour">←</button>}<strong style={{ fontSize: 21 }}>SafePay</strong></header><section style={{ paddingTop: 28 }}><div className="safepay-card" style={{ padding: 22 }}><div style={{ color: "var(--sp-muted)", fontSize: 13 }}>SafePay V5</div><h1 style={{ margin: "8px 0" }}>{title}</h1>
  {step === "method" && <><p style={{ color: "var(--sp-muted)" }}>L’inscription commence obligatoirement par l’email ou Google.</p><button disabled={busy} onClick={continueWithGoogle} style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid var(--sp-line)", background: "#fff", display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}><GoogleMark /> Continuer avec Google</button><div style={{ textAlign: "center", margin: "18px 0", color: "var(--sp-muted)" }}>ou</div><form onSubmit={submitEmail}><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label><button className="safepay-primary" style={{ width: "100%", marginTop: 14 }}>Continuer</button></form></>}
  {step === "password" && <form onSubmit={submitPassword}><p style={{ color: "var(--sp-muted)" }}>Compte : {email}</p><label>Mot de passe<input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label><label style={{ display: "block", marginTop: 12 }}>Confirmer<input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label><button className="safepay-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>{busy ? "Création…" : "Créer le compte"}</button></form>}
  {step === "emailVerify" && <div><p>Vérifiez votre boîte email et cliquez sur le lien envoyé par Supabase. Le lien vous ramènera automatiquement à SafePay.</p><button className="safepay-primary" onClick={confirmEmailVerification} disabled={busy} style={{ width: "100%" }}>{busy ? "Vérification…" : "J’ai vérifié mon email"}</button></div>}
  {step === "phone" && <form onSubmit={submitPhone}><p style={{ color: "var(--sp-muted)" }}>Choisissez le pays. Le drapeau et l’indicatif sont séparés du numéro local.</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 10 }}><select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }}>{SAFE_PAY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.callingCode}</option>)}</select><input value={phoneLocal} onChange={e => setPhoneLocal(onlyPhoneCharacters(e.target.value))} placeholder="90 XX XX XX" inputMode="tel" style={{ padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></div><div style={{ marginTop: 10, color: "var(--sp-muted)", fontSize: 13 }}>{country.name} · {country.currency}</div><button className="safepay-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>{busy ? "Envoi…" : "Envoyer le code"}</button></form>}
  {step === "otp" && <form onSubmit={submitOtp}><p>Un code à 6 chiffres a été envoyé à {phoneE164}.</p><input required inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" style={{ width: "100%", padding: 15, fontSize: 24, letterSpacing: 6, textAlign: "center", borderRadius: 12, border: "1px solid var(--sp-line)" }} /><button className="safepay-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>{busy ? "Vérification…" : "Vérifier le numéro"}</button></form>}
  {step === "profile" && <form onSubmit={submitProfile}><p style={{ color: "var(--sp-muted)" }}>Téléphone vérifié : {phoneE164}</p><label>Nom complet<input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nom et prénom" style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label><label style={{ display: "block", marginTop: 12 }}>Type de compte<select value={role} onChange={e => setRole(e.target.value as "client" | "seller")} style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }}><option value="client">Client</option><option value="seller">Vendeur</option></select></label><button className="safepay-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>{busy ? "Finalisation…" : "Finaliser mon compte"}</button></form>}
  {message && <p style={{ marginTop: 14, color: "var(--sp-muted)", fontSize: 13 }} role="status">{message}</p>}</div></section></main>;
}

export default function AuthPage() {
  return <Suspense fallback={<main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}><p className="sp-muted">Chargement de l’authentification…</p></main>}><AuthPageContent /></Suspense>;
}
