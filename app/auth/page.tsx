"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.27c0-.73-.07-1.43-.2-2.09H12v3.96h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.26Z"/>
      <path fill="#34A853" d="M12 21.82c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.82Z"/>
      <path fill="#FBBC05" d="M6.54 13.91A5.86 5.86 0 0 1 6.23 12c0-.66.11-1.3.31-1.91V7.56H3.3A9.82 9.82 0 0 0 2.18 12c0 1.6.38 3.11 1.12 4.44l3.24-2.53Z"/>
      <path fill="#EA4335" d="M12 6.06c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.16 14.63 2.18 12 2.18a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.78 9.46 6.06 12 6.06Z"/>
    </svg>
  );
}

export default function AuthPage() {
  const [step, setStep] = useState<"method" | "password" | "phone" | "profile">("method");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryCode, setCountryCode] = useState("TG");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const country = useMemo(() => SAFE_PAY_COUNTRIES.find((c) => c.code === countryCode) ?? SAFE_PAY_COUNTRIES[0], [countryCode]);

  async function continueWithGoogle() {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setMessage(error.message);
    setBusy(false);
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage("Entrez une adresse email valide.");
    setStep("password");
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) return setMessage("Le mot de passe doit respecter les règles de sécurité SafePay.");
    if (password !== confirm) return setMessage("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setStep("phone");
    setMessage("Compte créé. Vérifiez votre email, puis continuez avec votre numéro de téléphone.");
  }

  function submitPhone(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const result = validatePhone(country.code, phone);
    if (!result.valid) return setMessage(result.reason);
    setPhone(result.e164);
    setStep("profile");
    setMessage(`Numéro valide. Format international : ${result.e164}. La vérification OTP réelle sera effectuée avant phone_verified=true.`);
  }

  function submitProfile(event: FormEvent) {
    event.preventDefault();
    if (!/^[\p{L}][\p{L}\s'’-]{1,79}$/u.test(fullName.trim())) {
      return setMessage("Le nom complet doit contenir uniquement des caractères alphabétiques et des espaces.");
    }
    setMessage("Profil prêt. La liaison profile → account → wallet sera branchée sur le bootstrap V5 avant accès au dashboard.");
  }

  return (
    <main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
        {step !== "method" && <button className="safepay-icon" onClick={() => setStep(step === "password" ? "method" : step === "phone" ? "password" : "phone")} aria-label="Retour">←</button>}
        <strong style={{ fontSize: 21 }}>SafePay</strong>
      </header>

      <section style={{ paddingTop: 28 }}>
        <div className="safepay-card" style={{ padding: 22 }}>
          <div style={{ color: "var(--sp-muted)", fontSize: 13 }}>SafePay V5</div>
          <h1 style={{ margin: "8px 0" }}>{step === "method" ? "Créer votre compte SafePay" : step === "password" ? "Créer votre mot de passe" : step === "phone" ? "Votre numéro de téléphone" : "Votre nom"}</h1>

          {step === "method" && <>
            <p style={{ color: "var(--sp-muted)" }}>Commencez par votre adresse email ou votre compte Google.</p>
            <button className="safepay-secondary" onClick={continueWithGoogle} disabled={busy} style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid var(--sp-line)", background: "#fff", display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}><GoogleMark /> Continuer avec Google</button>
            <div style={{ textAlign: "center", margin: "18px 0", color: "var(--sp-muted)" }}>ou</div>
            <form onSubmit={submitEmail}>
              <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label>
              <button className="safepay-primary" style={{ width: "100%", marginTop: 14 }}>Continuer</button>
            </form>
          </>}

          {step === "password" && <form onSubmit={submitPassword}>
            <p style={{ color: "var(--sp-muted)" }}>Compte : {email}</p>
            <label>Mot de passe<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label>
            <label style={{ display: "block", marginTop: 12 }}>Confirmer<input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label>
            <button className="safepay-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>{busy ? "Création…" : "Créer le compte"}</button>
          </form>}

          {step === "phone" && <form onSubmit={submitPhone}>
            <p style={{ color: "var(--sp-muted)" }}>Choisissez le pays puis saisissez uniquement le numéro national.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 10 }}>
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }}>
                {SAFE_PAY_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.callingCode}</option>)}
              </select>
              <input value={phone} onChange={(e) => setPhone(onlyPhoneCharacters(e.target.value))} placeholder="90 XX XX XX" inputMode="tel" style={{ padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} />
            </div>
            <div style={{ marginTop: 10, color: "var(--sp-muted)", fontSize: 13 }}>{country.name} · {country.currency}</div>
            <button className="safepay-primary" style={{ width: "100%", marginTop: 14 }}>Continuer</button>
          </form>}

          {step === "profile" && <form onSubmit={submitProfile}>
            <p style={{ color: "var(--sp-muted)" }}>Le téléphone devra être confirmé par OTP avant d’être marqué comme vérifié.</p>
            <label>Nom complet<input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom et prénom" style={{ width: "100%", marginTop: 7, padding: 13, borderRadius: 12, border: "1px solid var(--sp-line)" }} /></label>
            <button className="safepay-primary" style={{ width: "100%", marginTop: 14 }}>Continuer</button>
          </form>}

          {message && <p style={{ marginTop: 14, color: "var(--sp-muted)", fontSize: 13 }}>{message}</p>}
        </div>
      </section>
    </main>
  );
}
