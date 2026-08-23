"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminStyles from "./AdminStyles";

type Setting={key:string;label:string;description:string;type:"number"|"boolean";value:number|boolean;unit?:string};
type Row=Record<string,unknown>;
type ModuleKey="overview"|"users"|"transactions"|"wallets"|"disputes"|"kyc"|"settings";

const DEFAULT_SETTINGS:Setting[]=[
 {key:"commission_rate_percent",label:"Commission SafePay",description:"Commission prélevée sur les transactions sécurisées.",type:"number",value:2,unit:"%"},
 {key:"deposit_fee_percent",label:"Frais de recharge",description:"Frais appliqués lors d'une recharge du Wallet.",type:"number",value:0,unit:"%"},
 {key:"withdrawal_fee_percent",label:"Frais de retrait",description:"Frais appliqués lors d'un retrait du Wallet.",type:"number",value:0,unit:"%"},
 {key:"minimum_transaction_amount",label:"Transaction minimum",description:"Montant minimum autorisé pour une transaction.",type:"number",value:100,unit:"XOF"},
 {key:"maximum_transaction_amount",label:"Transaction maximum",description:"Montant maximum autorisé pour une transaction.",type:"number",value:1000000,unit:"XOF"},
 {key:"daily_withdrawal_limit",label:"Limite quotidienne de retrait",description:"Montant maximum retirable par utilisateur et par jour.",type:"number",value:1000000,unit:"XOF"},
 {key:"maintenance_mode",label:"Mode maintenance",description:"Mettre temporairement l'application en maintenance.",type:"boolean",value:false},
 {key:"notifications_enabled",label:"Notifications globales",description:"Autoriser les notifications de la plateforme.",type:"boolean",value:true}
];
const FLAGS=[["new_signups_enabled","Nouvelles inscriptions","Autoriser la création de nouveaux comptes."],["deposits_enabled","Recharges","Autoriser les recharges de Wallet."],["withdrawals_enabled","Retraits","Autoriser les retraits du Wallet."],["card_payments_enabled","Paiements par carte","Autoriser les paiements par carte bancaire."],["disputes_enabled","Litiges","Autoriser l'ouverture de nouveaux litiges."]] as const;
const MODULES:[ModuleKey,string,string][]=[
 ["overview","Vue générale","Statistiques SafePay"],["users","Utilisateurs","Comptes et profils"],["transactions","Transactions","Paiements et opérations"],["wallets","Wallets","Soldes et mouvements"],["disputes","Litiges","Dossiers à traiter"],["kyc","KYC","Vérifications"],["settings","Paramètres","Configuration et feature flags"]
];
const TABLES:Record<Exclude<ModuleKey,"overview"|"settings">,string>={users:"profiles",transactions:"transactions",wallets:"wallets",disputes:"disputes",kyc:"kyc"};

function money(value:unknown){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"XOF",maximumFractionDigits:0}).format(Number(value??0));}
function display(value:unknown){if(value===null||value===undefined||value==="")return "—"; if(typeof value==="boolean")return value?"Oui":"Non"; if(typeof value==="object")return JSON.stringify(value); return String(value);}
function Metric({label,value,accent}:{label:string;value:string;accent?:string}){return <div className="sp-admin-metric"><small>{label}</small><strong style={{color:accent||"var(--sp-text)"}}>{value}</strong></div>}

export default function AdminPage(){
 const router=useRouter();
 const[active,setActive]=useState<ModuleKey>("overview");
 const[settings,setSettings]=useState<Setting[]>(DEFAULT_SETTINGS);
 const[flags,setFlags]=useState<Record<string,boolean>>({});
 const[reason,setReason]=useState("");
 const[loading,setLoading]=useState(true); const[saving,setSaving]=useState<string|null>(null);
 const[message,setMessage]=useState(""); const[error,setError]=useState(""); const[summary,setSummary]=useState<Row|null>(null);
 const[rows,setRows]=useState<Row[]>([]); const[rowsLoading,setRowsLoading]=useState(false); const[rowsError,setRowsError]=useState(""); const[search,setSearch]=useState("");

 useEffect(()=>{(async()=>{const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/login?next=/admin");return;}const{data:isAdmin,error:adminError}=await supabase.rpc("is_admin");if(adminError||!isAdmin){setError("Accès administrateur requis.");setLoading(false);return;}const[{data:s,error:se},{data:sum,error:sume},{data:f,error:fe}]=await Promise.all([supabase.rpc("get_public_settings"),supabase.rpc("get_admin_dashboard_summary"),supabase.from("feature_flags").select("key,enabled")]);if(se)setError(se.message);else if(s)setSettings(DEFAULT_SETTINGS.map(i=>({...i,value:s[i.key]??i.value})));if(sume)setError(sume.message);else setSummary((sum??null) as Row|null);if(fe)setError(fe.message);else setFlags(Object.fromEntries((f??[]).map(r=>[r.key,r.enabled])));setLoading(false)})().catch(err=>{setError(err instanceof Error?err.message:"Impossible de charger le Dashboard Admin.");setLoading(false);})},[router]);

 useEffect(()=>{if(active==="overview"||active==="settings")return;let cancelled=false;(async()=>{setRowsLoading(true);setRowsError("");setRows([]);const supabase=createClient();const table=TABLES[active as Exclude<ModuleKey,"overview"|"settings">];const{data,error:e}=await supabase.from(table).select("*").limit(100);if(cancelled)return;if(e)setRowsError(e.message);else setRows((data??[]) as Row[]);setRowsLoading(false)})();return()=>{cancelled=true}},[active]);

 const filteredRows=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return rows;return rows.filter(row=>Object.values(row).some(v=>display(v).toLowerCase().includes(q)))},[rows,search]);
 const columns=useMemo(()=>{const keys=new Set<string>();filteredRows.slice(0,20).forEach(r=>Object.keys(r).forEach(k=>keys.add(k)));return Array.from(keys).slice(0,7)},[filteredRows]);

 async function save(item:Setting){const supabase=createClient();setSaving(item.key);setMessage("");setError("");const{error:e}=await supabase.rpc("admin_set_app_setting",{p_key:item.key,p_value_numeric:item.type==="number"?Number(item.value):null,p_value_text:null,p_value_boolean:item.type==="boolean"?Boolean(item.value):null,p_reason:reason.trim()||"Modification depuis le Dashboard Admin"});if(e)setError(e.message);else{setSettings(all=>all.map(x=>x.key===item.key?item:x));setMessage(`${item.label} mis à jour.`)}setSaving(null)}
 async function toggleFlag(key:string,enabled:boolean){const supabase=createClient();setSaving(key);setMessage("");setError("");const{error:e}=await supabase.rpc("admin_set_feature_flag",{p_key:key,p_enabled:enabled,p_reason:reason.trim()||"Modification depuis le Dashboard Admin"});if(e)setError(e.message);else{setFlags(c=>({...c,[key]:enabled}));setMessage("Fonctionnalité mise à jour.")}setSaving(null)}

 if(loading)return <main className="safepay-shell"><AdminStyles/><section className="sp-content"><p className="sp-muted">Chargement du Dashboard Admin…</p></section></main>;
 if(error==="Accès administrateur requis.")return <main className="safepay-shell"><AdminStyles/><section className="sp-content"><p className="sp-error" role="alert">{error}</p><button className="safepay-primary" onClick={()=>router.push("/dashboard")}>Retour à SafePay</button></section></main>;
 return <main className="safepay-shell safepay-dashboard"><AdminStyles/>
  <header className="sp-header"><div><span className="sp-eyebrow">SafePay</span><strong>Dashboard Admin</strong></div><button className="sp-back" onClick={()=>router.push("/dashboard")} aria-label="Retour">←</button></header>
  <section className="sp-content">
   <div className="sp-admin-nav" role="navigation" aria-label="Navigation administration">{MODULES.map(([key,label,desc])=><button key={key} className={active===key?"active":""} onClick={()=>{setActive(key);setSearch("");setMessage("")}}><strong>{label}</strong><small>{desc}</small></button>)}</div>
   {message&&<p className="sp-success" role="status">{message}</p>}{error&&<p className="sp-error" role="alert">{error}</p>}
   {active==="overview"&&<><p className="sp-eyebrow">Administration</p><h1 className="sp-title">Vue générale</h1><p className="sp-muted">Supervision de l'activité et de la santé financière de SafePay.</p>{summary&&<section className="sp-section-card"><div className="sp-section-head"><h2>Activité SafePay</h2></div><div className="sp-admin-metrics">{[["Commissions cumulées",money(summary.commissions),"var(--sp-green)"],["Volume transactions",money(summary.transaction_volume),""],["Utilisateurs",String(summary.users??0),""],["Transactions",String(summary.transactions??0),""],["Fonds bloqués",money(summary.escrow_locked),""],["Litiges ouverts",String(summary.open_disputes??0),""],["Retraits en attente",String(summary.pending_withdrawals??0),""],["KYC en attente",String(summary.pending_kyc??0),""]].map(([l,v,a])=><Metric key={l} label={l} value={v} accent={a||undefined}/>)}</div></section>}<section className="sp-section-card"><h2>Modules d'administration</h2><p className="sp-muted">Utilise le menu ci-dessus pour gérer les comptes, opérations et contrôles de la plateforme.</p></section></>}
   {active!=="overview"&&active!=="settings"&&<section className="sp-section-card"><div className="sp-section-head"><div><p className="sp-eyebrow">Administration</p><h1 className="sp-title">{MODULES.find(m=>m[0]===active)?.[1]}</h1></div></div><p className="sp-muted">Données réelles accessibles par les règles de sécurité Supabase.</p><input className="sp-admin-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher dans les données…"/>{rowsLoading?<p className="sp-muted">Chargement…</p>:rowsError?<p className="sp-error">Impossible de charger ce module : {rowsError}</p>:filteredRows.length===0?<p className="sp-muted">Aucune donnée trouvée.</p>:<div className="sp-admin-table-wrap"><table className="sp-admin-table"><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{filteredRows.map((row,i)=><tr key={String(row.id??row.uuid??i)}>{columns.map(c=><td key={c}>{display(row[c])}</td>)}</tr>)}</tbody></table></div>}</section>}
   {active==="settings"&&<><p className="sp-eyebrow">Administration</p><h1 className="sp-title">Configuration de la plateforme</h1><p className="sp-muted">Les paramètres financiers sont enregistrés côté Supabase. Aucun paramètre sensible n'est stocké dans le navigateur.</p><section className="sp-section-card"><div className="sp-section-head"><h2>Paramètres financiers</h2></div><label className="sp-form"><span>Motif de modification</span><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex. ajustement tarifaire"/></label><div className="sp-admin-settings">{settings.filter(i=>i.type==="number").map(item=><div className="sp-admin-setting" key={item.key}><div><strong>{item.label}</strong><small>{item.description}</small></div><div className="sp-admin-control"><input type="number" min="0" step="0.01" value={String(item.value)} onChange={e=>setSettings(all=>all.map(x=>x.key===item.key?{...x,value:Number(e.target.value)}:x))}/><span>{item.unit}</span><button className="safepay-primary" disabled={saving===item.key} onClick={()=>save(item)}>{saving===item.key?"…":"Enregistrer"}</button></div></div>)}</div></section><section className="sp-section-card"><div className="sp-section-head"><h2>Plateforme</h2></div><div className="sp-admin-settings">{settings.filter(i=>i.type==="boolean").map(item=>{const next=!Boolean(item.value);return <div className="sp-admin-setting" key={item.key}><div><strong>{item.label}</strong><small>{item.description}</small></div><button className="safepay-secondary" disabled={saving===item.key} onClick={()=>save({...item,value:next})}>{item.value?"Activé":"Désactivé"}</button></div>})}</div></section><section className="sp-section-card"><div className="sp-section-head"><h2>Feature flags</h2></div><div className="sp-admin-settings">{FLAGS.map(([key,label,description])=>{const enabled=flags[key]??false;return <div className="sp-admin-setting" key={key}><div><strong>{label}</strong><small>{description}</small></div><button className="safepay-secondary" disabled={saving===key} onClick={()=>toggleFlag(key,!enabled)}>{enabled?"Activé":"Désactivé"}</button></div>})}</div></section></>}
  </section>
 </main>;
}