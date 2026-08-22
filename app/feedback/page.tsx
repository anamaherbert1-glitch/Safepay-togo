"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = message.trim();
    if (!text) return setError("Écrivez votre retour avant de l'envoyer.");
    setBusy(true); setError(""); setSent(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée. Reconnectez-vous."); setBusy(false); return; }
    const { error: insertError } = await supabase.from("feedback").insert({ user_id: user.id, message: text });
    if (insertError) setError(insertError.message); else { setMessage(""); setSent(true); }
    setBusy(false);
  }

  return <AppShell><section className="sp-page"><p className="sp-eyebrow">SafePay</p><h1 className="sp-title">Votre avis</h1><section className="sp-section-card"><p className="sp-muted">Aidez-nous à améliorer SafePay. Votre retour est transmis à l'équipe d'administration.</p><div className="sp-form" style={{marginTop:12}}><textarea rows={6} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Qu'est-ce que vous aimez ou souhaitez améliorer ?"/><button className="safepay-primary sp-submit" disabled={busy} onClick={submit}>{busy ? "Envoi…" : "Envoyer mon avis"}</button></div></section>{sent&&<p className="sp-success-note" role="status">Merci. Votre avis a bien été envoyé.</p>}{error&&<p className="sp-form-error" role="alert">{error}</p>}<button className="sp-secondary-button" style={{marginTop:10}} onClick={()=>router.back()}>← Retour</button></section></AppShell>;
}
