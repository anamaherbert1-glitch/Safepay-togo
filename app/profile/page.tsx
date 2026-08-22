"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";

function ProfileIcon() {
  return <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9"/></svg>;
}
function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        if (mounted) { setError("Session expirée. Reconnectez-vous."); setLoading(false); }
        return;
      }
      const [profileResult, accountResult, securityResult] = await Promise.all([
        supabase.rpc("get_my_profile"),
        supabase.rpc("get_my_account"),
        supabase.from("user_security").select("biometric_enabled").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      if (profileResult.error) setError(profileResult.error.message); else setProfile(profileResult.data);
      if (accountResult.error) setError(accountResult.error.message); else setAccount(accountResult.data);
      if (securityResult.error) setError(securityResult.error.message); else setSecurity(securityResult.data);
      setEmail(user.email ?? "");
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  const fullName = profile?.full_name || account?.name || "Utilisateur SafePay";
  const phone = profile?.phone || account?.phone || "Non renseigné";
  const country = profile?.country || account?.country || "Non renseigné";
  const role = profile?.role === "seller" ? "Vendeur" : profile?.role === "admin" ? "Administrateur" : "Client";

  return <AppShell><section className="sp-page">
    <div className="sp-page-head"><div><p className="sp-eyebrow">Compte SafePay</p><h1 className="sp-title">Profil</h1></div></div>
    {loading ? <p className="sp-muted">Chargement du profil…</p> : <>
      <section className="sp-section-card" style={{ textAlign:"center", paddingTop:24, paddingBottom:24 }}><div style={{width:86,height:86,margin:"0 auto 12px",borderRadius:"50%",display:"grid",placeItems:"center",color:"var(--sp-muted)",border:"1px solid var(--sp-line)",background:"transparent"}}><ProfileIcon /></div><h2 style={{margin:"0 0 4px",fontSize:19}}>{fullName}</h2><p className="sp-muted" style={{margin:0}}>{role}</p></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Informations personnelles</h2></div><div className="sp-detail-grid"><div><span>Adresse email</span><strong>{email || "Non renseignée"}</strong></div><div><span>Téléphone</span><strong>{phone}</strong></div><div><span>Pays</span><strong>{country}</strong></div><div><span>Rôle</span><strong>{role}</strong></div></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Vérification</h2></div><div style={{display:"grid",gap:10,marginTop:10}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>Email</span><span className="sp-success-note" style={{display:"flex",alignItems:"center",gap:4}}><CheckIcon/> Compte Auth</span></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>Téléphone</span>{profile?.phone_verified?<span className="sp-success-note" style={{display:"flex",alignItems:"center",gap:4}}><CheckIcon/> Vérifié</span>:<span className="sp-muted">Non vérifié</span>}</div></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Sécurité</h2></div><div style={{display:"grid",gap:10,marginTop:10}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>PIN SafePay</span><span className="sp-muted">Géré par Supabase</span></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>Biométrie</span><span className="sp-muted">{security?.biometric_enabled?"Activée":"Désactivée"}</span></div></div></section>
      <section className="sp-section-card"><div className="sp-action-stack"><button className="sp-secondary-button" onClick={()=>router.push("/notifications")}>Notifications</button><button className="sp-secondary-button" onClick={()=>router.push("/support")}>Support SafePay</button><button className="sp-secondary-button" onClick={()=>router.push("/feedback")}>Donner mon avis</button><button className="sp-secondary-button" onClick={()=>router.push("/services")}>Paramètres et services</button><button className="safepay-primary sp-submit" onClick={logout}>Se déconnecter</button></div></section>
    </>}
    {error&&<p className="sp-error" role="alert">{error}</p>}
  </section></AppShell>;
}
