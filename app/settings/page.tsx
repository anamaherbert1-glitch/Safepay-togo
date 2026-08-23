"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";
import { getDisplayCurrency, getLanguage, getNotificationSoundEnabled, getTheme, setDisplayCurrency, setLanguage, setNotificationSoundEnabled, setTheme, type SafePayDisplayCurrency, type SafePayLanguage, type SafePayTheme } from "@/lib/preferences";

function ThemeIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/></svg>}
function LanguageIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 5h8M8 3v2M6 5c.5 4 2.2 6.4 5 8"/><path d="M4.5 13c2.8-1.4 5-3.5 6.5-6"/><path d="M14 14h6M17 10l-3 9M15 17h5"/></svg>}
function CurrencyIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M14.5 8.5c-.7-.7-1.7-1-2.8-1-1.7 0-2.7.9-2.7 2s1 1.7 2.8 2c1.9.3 2.8 1 2.8 2.3s-1.1 2.2-2.9 2.2c-1.1 0-2.1-.4-2.9-1.1"/><path d="M12 6v12"/></svg>}
function PinIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/></svg>}
function FingerprintIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 11a2 2 0 0 1 2 2v2.5M9.5 18.5A7 7 0 0 0 12 6a6 6 0 0 0-5.7 4.2M16.5 18.5A10 10 0 0 0 12 4a9 9 0 0 0-8.4 5.7M7 21a10 10 0 0 0 5-1.3M18.5 21a13 13 0 0 0 1.5-6.1A8 8 0 0 0 4.8 12"/></svg>}
function BellIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}

export default function SettingsPage(){
  const [theme,setThemeState]=useState<SafePayTheme>("light");
  const [language,setLanguageState]=useState<SafePayLanguage>("fr");
  const [currency,setCurrencyState]=useState<SafePayDisplayCurrency>("XOF");
  const [sound,setSound]=useState(true);
  const [biometric,setBiometric]=useState(false);
  const [pinOpen,setPinOpen]=useState(false);
  const [currentPin,setCurrentPin]=useState("");
  const [newPin,setNewPin]=useState("");
  const [confirmPin,setConfirmPin]=useState("");
  const [pinMessage,setPinMessage]=useState("");
  const [pinError,setPinError]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    setThemeState(getTheme()); setLanguageState(getLanguage()); setCurrencyState(getDisplayCurrency()); setSound(getNotificationSoundEnabled());
    const supabase=createClient();
    supabase.rpc("get_my_security").then(({data})=>{ if(data?.biometric_enabled !== undefined) setBiometric(Boolean(data.biometric_enabled)); }).catch(()=>{});
    supabase.from("user_security").select("biometric_enabled").maybeSingle().then(({data})=>{ if(data) setBiometric(Boolean(data.biometric_enabled)); }).catch(()=>{});
  },[]);

  function changeTheme(next:SafePayTheme){setThemeState(next);setTheme(next);}
  function changeLanguage(next:SafePayLanguage){setLanguageState(next);setLanguage(next);}
  function changeCurrency(next:SafePayDisplayCurrency){setCurrencyState(next);setDisplayCurrency(next);}
  function changeSound(next:boolean){setSound(next);setNotificationSoundEnabled(next);}

  async function toggleBiometric(){
    setBusy(true);
    try{
      const supabase=createClient();
      if(!biometric){
        if(!window.isSecureContext || !("credentials" in navigator) || !("PublicKeyCredential" in window)) throw new Error("La biométrie WebAuthn n'est pas disponible sur cet appareil ou ce navigateur.");
        const {data:{user}}=await supabase.auth.getUser();
        if(!user) throw new Error("Session expirée.");
        const challenge=crypto.getRandomValues(new Uint8Array(32));
        const credential=await navigator.credentials.create({publicKey:{challenge,rp:{name:"SafePay",id:window.location.hostname},user:{id:uuidBytes(user.id),name:user.phone||user.id,displayName:user.user_metadata?.full_name||"Utilisateur SafePay"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"preferred",userVerification:"required"},timeout:60000}}) as PublicKeyCredential | null;
        if(!credential) throw new Error("La configuration biométrique a été annulée.");
        localStorage.setItem("safepay-biometric-credential",toBase64Url(credential.rawId));
        const {data,error}=await supabase.rpc("set_my_biometric",{p_enabled:true});
        if(error) throw error;
        setBiometric(Boolean(data));
      }else{
        localStorage.removeItem("safepay-biometric-credential");
        const {data,error}=await supabase.rpc("set_my_biometric",{p_enabled:false});
        if(error) throw error;
        setBiometric(Boolean(data));
      }
    }catch(error){setPinError(error instanceof Error?error.message:"Impossible de modifier la biométrie.");}
    finally{setBusy(false);}
  }

  async function savePin(){
    setPinError(""); setPinMessage("");
    if(!/^\d{4,6}$/.test(newPin)) return setPinError("Le PIN doit contenir 4 à 6 chiffres.");
    if(newPin!==confirmPin) return setPinError("Les deux nouveaux PIN ne correspondent pas.");
    setBusy(true);
    try{
      const supabase=createClient();
      if(currentPin){ const {data,error}=await supabase.rpc("verify_my_pin",{p_pin:currentPin}); if(error) throw error; if(!data) throw new Error("Le PIN actuel est incorrect."); }
      const {error}=await supabase.rpc("set_my_pin",{p_pin:newPin}); if(error) throw error;
      setPinMessage("PIN SafePay mis à jour."); setCurrentPin(""); setNewPin(""); setConfirmPin("");
    }catch(error){setPinError(error instanceof Error?error.message:"Impossible de modifier le PIN.");}
    finally{setBusy(false);}
  }

  return <AppShell><section className="sp-page"><div className="sp-page-head"><div><p className="sp-eyebrow">Préférences</p><h1 className="sp-title">Paramètres</h1></div></div>
    <section className="sp-section-card"><h2>Apparence</h2><div className="settings-option"><span className="settings-option-icon blue"><ThemeIcon/></span><span className="settings-option-main"><strong>Thème</strong><small>Choisissez l'apparence claire ou sombre de SafePay.</small></span><span className="settings-option-value">{theme === "dark" ? "Sombre" : "Clair"}</span></div><div className="settings-segment"><button className={theme === "light" ? "active" : ""} onClick={()=>changeTheme("light")}>☀️ Clair</button><button className={theme === "dark" ? "active" : ""} onClick={()=>changeTheme("dark")}>🌙 Sombre</button></div></section>
    <section className="sp-section-card"><h2>Langue</h2><div className="settings-option"><span className="settings-option-icon green"><LanguageIcon/></span><span className="settings-option-main"><strong>Langue de l'application</strong><small>Le choix est mémorisé sur cet appareil.</small></span><span className="settings-option-value">{language === "fr" ? "Français" : "English"}</span></div><div className="settings-segment"><button className={language === "fr" ? "active" : ""} onClick={()=>changeLanguage("fr")}>🇫🇷 Français</button><button className={language === "en" ? "active" : ""} onClick={()=>changeLanguage("en")}>🇬🇧 English</button></div><p className="settings-hint">Le sélecteur est actif. Les nouveaux écrans seront branchés progressivement sur le dictionnaire multilingue sans modifier le design V5.</p></section>
    <section className="sp-section-card"><h2>Devise d'affichage</h2><div className="settings-option"><span className="settings-option-icon violet"><CurrencyIcon/></span><span className="settings-option-main"><strong>Devise préférée</strong><small>Préférence d'affichage enregistrée. Les règlements SafePay restent en XOF.</small></span><span className="settings-option-value">{currency}</span></div><select className="settings-select" value={currency} onChange={e=>changeCurrency(e.target.value as SafePayDisplayCurrency)} aria-label="Devise d'affichage"><option value="XOF">XOF — Franc CFA</option></select><p className="settings-hint">XOF est la devise financière actuelle de SafePay-Togo. EUR/USD seront activées après raccordement d'une source de taux de change côté backend, afin d'éviter toute conversion approximative.</p></section>
    <section className="sp-section-card"><h2>Sécurité</h2><button className="settings-option" onClick={()=>{setPinOpen(true);setPinError("");setPinMessage("")}}><span className="settings-option-icon orange"><PinIcon/></span><span className="settings-option-main"><strong>PIN SafePay</strong><small>Créer ou changer votre code secret sécurisé.</small></span><span className="settings-option-value">Modifier</span></button><button className="settings-option" onClick={toggleBiometric} disabled={busy} style={{marginTop:10}}><span className="settings-option-icon green"><FingerprintIcon/></span><span className="settings-option-main"><strong>Biométrie</strong><small>Activation locale sur un appareil compatible.</small></span><span className={biometric?"settings-toggle active":"settings-toggle"} aria-hidden="true"/></button><p className="settings-hint">La biométrie utilise WebAuthn. L'activation de l'indicateur backend existe déjà ; le véritable déverrouillage/authentification biométrique nécessitera encore le stockage serveur du credential et la vérification de challenge.</p></section>
    <section className="sp-section-card"><h2>Notifications</h2><button className="settings-option" onClick={()=>changeSound(!sound)}><span className="settings-option-icon blue"><BellIcon/></span><span className="settings-option-main"><strong>Son des notifications</strong><small>Jouer un son discret lorsqu'une nouvelle notification arrive pendant que l'application est ouverte.</small></span><span className={sound?"settings-toggle active":"settings-toggle"} aria-hidden="true"/></button></section>
    {pinOpen&&<div className="settings-modal" role="dialog" aria-modal="true" aria-label="Changer le PIN"><div className="settings-sheet"><div className="settings-sheet-head"><h2>Changer le PIN SafePay</h2><button className="settings-close" onClick={()=>setPinOpen(false)} aria-label="Fermer">×</button></div><div className="settings-field"><label>PIN actuel (laisser vide si vous en créez un)</label><input inputMode="numeric" maxLength={6} type="password" value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,""))}/></div><div className="settings-field"><label>Nouveau PIN</label><input inputMode="numeric" maxLength={6} type="password" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,""))}/></div><div className="settings-field"><label>Confirmer le nouveau PIN</label><input inputMode="numeric" maxLength={6} type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,""))}/></div>{pinError&&<p className="settings-error">{pinError}</p>}{pinMessage&&<p className="settings-success">{pinMessage}</p>}<button className="safepay-primary sp-submit" onClick={savePin} disabled={busy}>{busy?"Enregistrement…":"Enregistrer le PIN"}</button></div></div>}
  </section></AppShell>;
}

function uuidBytes(uuid: string) {
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
function toBase64Url(value: ArrayBuffer) {
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
