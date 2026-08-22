"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";

function ProfileIcon() { return <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9"/></svg>; }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>; }

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { if (mounted) { setError("Session expirée. Reconnectez-vous."); setLoading(false); } return; }
      const [profileResult, accountResult, securityResult] = await Promise.all([
        supabase.rpc("get_my_profile"),
        supabase.rpc("get_my_account"),
        supabase.from("user_security").select("biometric_enabled").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      if (profileResult.error) setError(profileResult.error.message); else setProfile(profileResult.data);
      if (accountResult.error) setError(accountResult.error.message); else setAccount(accountResult.data);
      if (securityResult.error) setError(securityResult.error.message); else setSecurity(securityResult.data);
      setEmail(user.email ?? ""); setLoading(false);
    };
    load(); return () => { mounted = false; };
  }, []);

  async function uploadAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Sélectionnez une image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La photo doit faire 5 Mo maximum."); return; }
    setError(""); setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setError("Session expirée."); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) { setUploading(false); setError(uploadError.message); return; }
    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: `${publicData.publicUrl}?v=${Date.now()}` }).eq("id", user.id);
    if (updateError) { setUploading(false); setError(updateError.message); return; }
    const { data: updatedProfile } = await supabase.rpc("get_my_profile");
    setProfile(updatedProfile); setUploading(false);
  }

  async function logout() { const supabase = createClient(); await supabase.auth.signOut(); router.replace("/"); }

  const fullName = profile?.full_name || account?.name || "Utilisateur SafePay";
  const phone = profile?.phone || account?.phone || "Non renseigné";
  const country = profile?.country || account?.country || "Non renseigné";
  const role = profile?.role === "seller" ? "Vendeur" : profile?.role === "admin" ? "Administrateur" : "Client";
  const avatarUrl = profile?.avatar_url || "";

  return <AppShell><section className="sp-page">
    <div className="sp-page-head"><div><p className="sp-eyebrow">Compte SafePay</p><h1 className="sp-title">Profil</h1></div></div>
    {loading ? <div className="sp-page-loading"><span className="sp-loader"/>Chargement du profil…</div> : <>
      <section className="sp-section-card" style={{ textAlign:"center", paddingTop:24, paddingBottom:24 }}><label className="sp-avatar-upload" title="Changer la photo de profil"><div className="sp-avatar-frame">{avatarUrl ? <img src={avatarUrl} alt="Photo de profil"/> : <ProfileIcon />}</div><input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading}/><span>{uploading ? "Envoi…" : "Modifier la photo"}</span></label><h2 style={{margin:"0 0 4px",fontSize:19}}>{fullName}</h2><p className="sp-muted" style={{margin:0}}>{role}</p></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Informations personnelles</h2></div><div className="sp-detail-grid"><div><span>Adresse email</span><strong>{email || "Non renseignée"}</strong></div><div><span>Téléphone</span><strong>{phone}</strong></div><div><span>Pays</span><strong>{country}</strong></div><div><span>Rôle</span><strong>{role}</strong></div></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Vérification</h2></div><div style={{display:"grid",gap:10,marginTop:10}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>Email</span><span className="sp-success-note"><CheckIcon/> Compte Auth</span></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>Téléphone</span>{profile?.phone_verified?<span className="sp-success-note"><CheckIcon/> Vérifié</span>:<span className="sp-muted">Non vérifié</span>}</div></div></section>
      <section className="sp-section-card"><div className="sp-section-head"><h2>Sécurité</h2></div><div style={{display:"grid",gap:10,marginTop:10}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>PIN SafePay</span><span className="sp-muted">Géré par Supabase</span></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>Biométrie</span><span className="sp-muted">{security?.biometric_enabled?"Activée":"Désactivée"}</span></div></div></section>
      <section className="sp-section-card"><div className="sp-action-stack"><button className="sp-secondary-button" onClick={()=>router.push("/notifications")}>Notifications</button><button className="sp-secondary-button" onClick={()=>router.push("/support")}>Support SafePay</button><button className="sp-secondary-button" onClick={()=>router.push("/feedback")}>Donner mon avis</button><button className="sp-secondary-button" onClick={()=>router.push("/services")}>Paramètres et services</button><button className="safepay-primary sp-submit" onClick={logout}>Se déconnecter</button></div></section>
    </>}
    {error&&<p className="sp-error" role="alert">{error}</p>}
  </section></AppShell>;
}
