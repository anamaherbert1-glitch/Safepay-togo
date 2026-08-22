"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Setting = { key:string; label:string; description:string; type:"number"|"boolean"; value:number|boolean; unit?:string };
const DEFAULT_SETTINGS: Setting[] = [
 {key:"commission_rate_percent",label:"Commission SafePay",description:"Commission prélevée sur les transactions sécurisées.",type:"number",value:2,unit:"%"},
 {key:"deposit_fee_percent",label:"Frais de recharge",description:"Frais appliqués lors d'une recharge du Wallet.",type:"number",value:0,unit:"%"},
 {key:"withdrawal_fee_percent",label:"Frais de retrait",description:"Frais appliqués lors d'un retrait.",type:"number",value:0,unit:"%"},
 {key:"minimum_transaction_amount",label:"Transaction minimum",description:"Montant minimum autorisé pour une transaction.",type:"number",value:100,unit:"XOF"},
 {key:"maximum_transaction_amount",label:"Transaction maximum",description:"Montant maximum autorisé pour une transaction.",type:"number",value:1000000,unit:"XOF"},
 {key:"daily_withdrawal_limit",label:"Limite quotidienne de retrait",description:"Montant maximum retirable par utilisateur et par jour.",type:"number",value:1000000,unit:"XOF"},
 {key:"maintenance_mode",label:"Mode maintenance",description:"Mettre temporairement l'application en maintenance.",type:"boolean",value:false},
 {key:"notifications_enabled",label:"Notifications globales",description:"Autoriser les notifications de la plateforme.",type:"boolean",value:true},
];
const FLAGS = [
 ["new_signups_enabled","Nouvelles inscriptions","Autoriser la création de nouveaux comptes."],
 ["deposits_enabled","Recharges","Autoriser les recharges de Wallet."],
 ["withdrawals_enabled","Retraits","Autoriser les retraits de Wallet."],
 ["card_payments_enabled","Paiements par carte","Autoriser les paiements par carte bancaire."],
 ["disputes_enabled","Litiges","Autoriser l'ouverture de nouveaux litiges."],
] as const;

export default function AdminPage(){
 const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
 const [settings,setSettings]=useState<Setting[]>(DEFAULT_SETTINGS); const [flags,setFlags]=useState<Record<string,boolean>>({});
 const [reason,setReason]=useState(""); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState<string|null>(null); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [summary,setSummary]=useState<Record<string,unknown>|null>(null);
 useEffect(()=>{(async()=>{setLoading(true);setError(""); const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/login?next=/admin");return;}
  const [{data:publicSettings,error:settingsError},{data:summaryData,error:summaryError},{data:featureRows,error:flagsError}]=await Promise.all([supabase.rpc("get_public_settings"),supabase.rpc("get_admin_dashboard_summary"),supabase.from("feature_flags").select("key,enabled")]);
  if(settingsError)setError(settingsError.message); else if(publicSettings)setSettings(DEFAULT_SETTINGS.map(i=>({...i,value:publicSettings[i.key]??i.value})));
  if(summaryError&&summaryError.message!=="admin_required")setError(summaryError.message); else setSummary((summaryData??null) as Record<string,unknown>|null);
  if(flagsError)setError(flagsError.message); else setFlags(Object.fromEntries((featureRows??[]).map(r=>[r.key,r.enabled]))); setLoading(false);
 })()},[router,supabase]);
 async function saveSetting(event:FormEvent,item:Setting){event.preventDefault();setSaving(item.key);setMessage("");setError("");const {error:e}=await supabase.rpc("admin_set_app_setting",{p_key:item.key,p_value_numeric:item.type==="number"?Number(item.value):null,p_value_text:null,p_value_boolean:item.type==="boolean"?Boolean(item.value):null,p_reason:reason.trim()||"Modification depuis le Dashboard Admin"});if(e)setError(e.message);else{setSettings(all=>all.map(x=>x.key===item.key?item:x));setMessage(`${item.label} mis à jour.`);}setSaving(null);}
 async function toggleFlag(key:string,enabled:boolean){setSaving(key);setMessage("");setError("");const {error:e}=await supabase.rpc("admin_set_feature_flag",{p_key:key,p_enabled:enabled,p_reason:reason.trim()||"Modification depuis le Dashboard Admin"});if(e)setError(e.message);else{setFlags(c=>({...c,[key]:enabled}));setMessage("Fonctionnalité mise à jour.");}setSaving(null);}
 if(loading)return <main className="safepay-shell"><section className="sp-content"><p className="sp-muted">Chargement du Dashboard Admin…</p></section></main>;
 return <main className="safepay-shell safepay-dashboard"><header className="sp-header"><div><span className="sp-eyebrow">SafePay</span><strong>Dashboard Admin</strong></div><button className="sp-back" onClick={()=>router.push("/dashboard")} aria-label="Retour">←</button></header><section className="sp-content"><p className="sp-eyebrow">Administration</p><h1 className="sp-title">Configuration de la plateforme</h1><p className="sp-muted">Les modifications passent par Supabase et sont consommées par le backend SafePay. Aucun paramètre financier n'est enregistré dans le navigateur.</p>
 {message&&<p className="sp-success" role="status">{message}</p>}{error&&<p className="sp-error" role="alert">{error}</p>}
 <section className="sp-section-card"><div className="sp-section-head"><h2>Paramètres financiers</h2></div><label className="sp-form"><span>Motif de modification</span><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex. ajustement tarifaire" /></label><div className="sp-admin-settings">{settings.filter(i=>i.type==="number").map(item=><form className="sp-admin-setting" key={item.key} onSubmit={e=>saveSetting(e,item)}><div><strong>{item.label}</strong><small>{item.description}</small></div><div className="sp-admin-control"><input type="number" min="0" step="0.01" value={String(item.value)} onChange={e=>setSettings(all=>all.map(x=>x.key===item.key?{...x,value:Number(e.target.value)}:x))}/><span>{item.unit}</span><button className="safepay-primary" disabled={saving===item.key}>{saving===item.key?"…":"Enregistrer"}</button></div></form>)}</div></section>
 <section className="sp-section-card"><div className="sp-section-head"><h2>Plateforme</h2></div><div className="sp-admin-settings">{settings.filter(i=>i.type==="boolean").map(item=><div className="sp-admin-setting" key={item.key}><div><strong>{item.label}</strong><small>{item.description}</small></div><button className="safepay-secondary" disabled={saving===item.key} onClick={()=>saveSetting({preventDefault:()=>{}} as FormEvent,{...item,value:!item.value})}>{item.value?"Activé":"Désactivé"}</button></div>)}</div></section>
 <section className="sp-section-card"><div className="sp-section-head"><h2>Feature flags</h2></div><div className="sp-admin-settings">{FLAGS.map(([key,label,description])=>{const enabled=flags[key]??false;return <div className="sp-admin-setting" key={key}><div><strong>{label}</strong><small>{description}</small></div><button className="safepay-secondary" disabled={saving===key} onClick={()=>toggleFlag(key,!enabled)}>{enabled?"Activé":"Désactivé"}</button></div>})}</div></section>
 {summary&&<section className="sp-section-card"><div className="sp-section-head"><h2>Résumé administratif</h2></div><pre className="sp-admin-summary">{JSON.stringify(summary,null,2)}</pre></section>}
 </section></main>;
}
