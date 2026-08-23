"use client";

import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import AdminStyles from "./AdminStyles";

type Row=Record<string,unknown>;
type Module="overview"|"users"|"transactions"|"wallets"|"ledger"|"deposits"|"withdrawals"|"disputes"|"support"|"notifications"|"revenue"|"invoices"|"settings"|"features"|"audit"|"admins"|"security";
type Setting={key:string;label:string;description:string;type:"number"|"boolean";value:number|boolean;unit?:string};

const modules:[Module,string,string][]=[
 ["overview","Dashboard","Vue générale"],["users","Utilisateurs","Comptes & KYC"],["transactions","Transactions","Flux financiers"],["wallets","Wallets","Soldes"],["ledger","Ledger","Journal financier"],["deposits","Dépôts","Recharges"],["withdrawals","Retraits","Payouts"],["disputes","Litiges","Escrow"],["support","Support","Tickets"],["notifications","Notifications","Communication"],["revenue","Revenus","Platform fees"],["invoices","Factures","Documents"],["settings","Paramètres","Configuration"],["features","Feature Flags","Fonctionnalités"],["audit","Audit Logs","Traçabilité"],["admins","Administrateurs","Accès"],["security","Sécurité","Contrôles"]
];
const settingsDefault:Setting[]=[
 {key:"commission_rate_percent",label:"Commission SafePay",description:"Commission appliquée aux transactions.",type:"number",value:2,unit:"%"},
 {key:"deposit_fee_percent",label:"Frais dépôt",description:"Frais de recharge.",type:"number",value:0,unit:"%"},
 {key:"withdrawal_fee_percent",label:"Frais retrait",description:"Frais de retrait.",type:"number",value:0,unit:"%"},
 {key:"minimum_transaction_amount",label:"Minimum transaction",description:"Montant minimum autorisé.",type:"number",value:100,unit:"XOF"},
 {key:"maximum_transaction_amount",label:"Maximum transaction",description:"Montant maximum autorisé.",type:"number",value:1000000,unit:"XOF"},
 {key:"daily_withdrawal_limit",label:"Limite retrait/jour",description:"Plafond journalier de retrait.",type:"number",value:1000000,unit:"XOF"},
 {key:"maintenance_mode",label:"Mode maintenance",description:"Suspendre temporairement les opérations.",type:"boolean",value:false},
 {key:"notifications_enabled",label:"Notifications",description:"Autoriser les notifications plateforme.",type:"boolean",value:true}
];
const flags=["new_signups_enabled","deposits_enabled","withdrawals_enabled","card_payments_enabled","disputes_enabled"];
const money=(v:unknown)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"XOF",maximumFractionDigits:0}).format(Number(v??0));
const value=(v:unknown)=>v==null||v===""?"—":typeof v==="object"?JSON.stringify(v):String(v);

export default function AdminPage(){
 const router=useRouter();
 const [active,setActive]=useState<Module>("overview");
 const [rows,setRows]=useState<Row[]>([]); const [total,setTotal]=useState(0); const [page,setPage]=useState(0);
 const [search,setSearch]=useState(""); const [status,setStatus]=useState(""); const [summary,setSummary]=useState<Row>({});
 const [settings,setSettings]=useState(settingsDefault); const [flagState,setFlagState]=useState<Record<string,boolean>>({});
 const [analytics,setAnalytics]=useState<Row[]>([]); const [days,setDays]=useState(30);
 const [error,setError]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
 const size=25;

 useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){router.replace("/login?next=/admin");return;}const a=await s.rpc("is_admin");if(a.error||!a.data){setError("Accès administrateur requis.");setLoading(false);return;}const [pub,sum,stats,ff]=await Promise.all([s.rpc("get_public_settings"),s.rpc("get_admin_dashboard_summary"),s.rpc("admin_dashboard_stats"),s.from("feature_flags").select("key,enabled")]);if(pub.data)setSettings(settingsDefault.map(x=>({...x,value:pub.data[x.key]??x.value})));setSummary({...sum.data,...stats.data});if(ff.data)setFlagState(Object.fromEntries(ff.data.map(x=>[x.key,x.enabled])));setLoading(false);})().catch(e=>{setError(e instanceof Error?e.message:"Erreur de chargement");setLoading(false)})},[router]);
 useEffect(()=>{if(!loading)load()},[active,page,status,search,days,loading]);
 async function load(){const s=createClient();setError("");let r:any=null;const q=search.trim()||null;
  if(active==="users")r=await s.rpc("admin_list_users",{p_search:q,p_limit:size,p_offset:page*size});
  else if(active==="transactions")r=await s.rpc("admin_list_transactions",{p_search:q,p_status:status||null,p_limit:size,p_offset:page*size});
  else if(active==="wallets")r=await s.rpc("admin_list_wallets",{p_search:q,p_limit:size,p_offset:page*size});
  else if(active==="ledger")r=await s.rpc("admin_list_ledger",{p_search:q,p_limit:size,p_offset:page*size});
  else if(active==="deposits")r=await s.rpc("admin_list_deposits",{p_search:q,p_status:status||null,p_limit:size,p_offset:page*size});
  else if(active==="withdrawals")r=await s.rpc("admin_list_withdrawals",{p_search:q,p_status:status||null,p_limit:size,p_offset:page*size});
  else if(active==="disputes")r=await s.rpc("admin_list_disputes",{p_status:status||null,p_limit:size,p_offset:page*size});
  else if(active==="support")r=await s.rpc("admin_list_support_tickets",{p_status:status||null,p_limit:size,p_offset:page*size});
  else if(active==="audit")r=await s.rpc("admin_list_audit_logs",{p_limit:size,p_offset:page*size});
  else if(active==="invoices")r=await s.rpc("admin_list_invoices",{p_search:q,p_limit:size,p_offset:page*size});
  else if(active==="admins")r=await s.rpc("admin_list_admin_users",{p_limit:size,p_offset:page*size});
  else if(active==="revenue"){const x=await s.rpc("admin_analytics_timeseries",{p_days:days});r={data:{items:x.data},error:x.error};setAnalytics(Array.isArray(x.data)?x.data:[])}
  if(r?.error){setError(r.error.message);setRows([]);return;}const d=r?.data;const items=Array.isArray(d)?d:d?.items??[];setRows(items);setTotal(Number(d?.total??items.length));
 }
 async function rpc(name:string,args:Record<string,unknown>){setBusy(true);setError("");setMessage("");const r=await createClient().rpc(name,args);if(r.error)setError(r.error.message);else setMessage("Opération enregistrée.");setBusy(false);await load()}
 async function account(id:string,activeNow:boolean){const reason=window.prompt("Motif de l'action")||"Action Admin";await rpc("admin_set_account_status",{p_user_id:id,p_is_active:activeNow,p_reason:reason})}
 async function notify(id:string){const title=window.prompt("Titre");const message=window.prompt("Message");if(title&&message)await rpc("admin_send_notification",{p_title:title,p_message:message,p_user_id:id})}
 async function dispute(id:string){const resolution=window.prompt("Décision / motif");if(resolution)await rpc("admin_resolve_dispute",{p_dispute_id:id,p_resolution:resolution,p_resolution_action:"resolve"})}
 async function withdrawal(id:string){const reason=window.prompt("Motif")||"Traitement Admin";await rpc("admin_update_withdrawal_status",{p_withdrawal_id:id,p_status:"processing",p_reason:reason})}
 const columns=useMemo(()=>{const set=new Set<string>();rows.forEach(r=>Object.keys(r).forEach(k=>set.add(k)));return [...set].filter(k=>k!=="details").slice(0,8)},[rows]);
 const reset=()=>{setPage(0);setSearch("");setStatus("")};
 const action=(r:Row)=>{const id=String(r.user_id??r.id??"");if(active==="users")return <><button className="safepay-secondary" onClick={()=>account(id,Boolean(r.is_active)===false)}>{Boolean(r.is_active)===false?"Réactiver":"Bloquer"}</button><button className="safepay-secondary" onClick={()=>notify(id)}>Notifier</button></>;if(active==="disputes")return <button className="safepay-secondary" disabled={busy} onClick={()=>dispute(id)}>Résoudre</button>;if(active==="withdrawals"&&r.status==="pending")return <button className="safepay-secondary" disabled={busy} onClick={()=>withdrawal(id)}>Traiter</button>;if(active==="admins")return <button className="safepay-secondary" disabled={busy} onClick={()=>rpc("admin_manage_admin_users",{p_target_user_id:id,p_action:"remove",p_role:"admin",p_reason:"Retrait Admin"})}>Retirer</button>;return <button className="safepay-secondary">Détails</button>};
 if(loading)return <main className="safepay-shell"><AdminStyles/><section className="sp-content"><p className="sp-muted">Chargement du centre d'administration…</p></section></main>;
 if(error==="Accès administrateur requis.")return <main className="safepay-shell"><AdminStyles/><section className="sp-content"><p className="sp-error">{error}</p><button className="safepay-primary" onClick={()=>router.push("/dashboard")}>Retour</button></section></main>;
 const current=modules.find(x=>x[0]===active);
 return <main className="sp-admin-app"><AdminStyles/>
  <aside className="sp-sidebar">
   <div className="sp-brand"><div className="sp-brand-mark">S</div><div><strong>SAFE PAY</strong><small>ADMIN CONSOLE</small></div></div>
   <div className="sp-side-label">GESTION</div>
   <nav>{modules.slice(0,12).map(([k,l,d])=><button key={k} className={active===k?"active":""} onClick={()=>{setActive(k);reset()}}><span className="sp-nav-icon">{icon(k)}</span><span>{l}</span>{active===k&&<i/>}</button>)}</nav>
   <div className="sp-side-label">CONFIGURATION</div>
   <nav>{modules.slice(12).map(([k,l])=><button key={k} className={active===k?"active":""} onClick={()=>{setActive(k);reset()}}><span className="sp-nav-icon">{icon(k)}</span><span>{l}</span>{active===k&&<i/>}</button>)}</nav>
   <div className="sp-side-bottom"><div className="sp-admin-avatar">A</div><div><strong>Administrateur</strong><small>Accès sécurisé</small></div><button onClick={()=>router.push("/dashboard")} aria-label="Retour">↩</button></div>
  </aside>
  <section className="sp-admin-main">
   <header className="sp-admin-header"><div><span className="sp-breadcrumb">SafePay / Administration</span><h1>{current?.[1]}</h1></div><div className="sp-header-actions"><span className="sp-live"><b/> Backend connecté</span><button className="sp-icon-button" onClick={()=>load()}>↻</button></div></header>
   <div className="sp-mobile-nav"><select value={active} onChange={e=>{setActive(e.target.value as Module);reset()}}>{modules.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>
   {message&&<div className="sp-success">✓ {message}</div>}{error&&<div className="sp-error">{error}</div>}
   {active==="overview"&&<Overview summary={summary} analytics={analytics} days={days} setDays={setDays}/>} 
   {active==="settings"&&<Settings settings={settings} setSettings={setSettings} rpc={rpc}/>} 
   {active==="features"&&<Features state={flagState} setState={setFlagState} rpc={rpc}/>} 
   {active==="notifications"&&<NotificationForm rpc={rpc}/>} 
   {active==="security"&&<Security/>}
   {!["overview","settings","features","notifications","security"].includes(active)&&<DataModule active={active} rows={rows} columns={columns} total={total} page={page} size={size} search={search} setSearch={setSearch} status={status} setStatus={setStatus} setPage={setPage} action={action}/>} 
  </section>
 </main>;
}

function icon(k:Module){const m:Record<string,string>={overview:"⌂",users:"♙",transactions:"⇄",wallets:"▣",ledger:"≡",deposits:"↓",withdrawals:"↑",disputes:"⚖",support:"?",notifications:"◔",revenue:"◈",invoices:"▤",settings:"⚙",features:"◆",audit:"◷",admins:"♟",security:"◉"};return m[k]??"•"}

function Overview({summary,analytics,days,setDays}:{summary:Row;analytics:Row[];days:number;setDays:(n:number)=>void}){const cards:[string,unknown,string][]=[
 ["Utilisateurs",summary.users_total??summary.users,"Total"],["Transactions",summary.transactions_total??summary.transactions,"Total"],["Volume",money(summary.transactions_volume_total??summary.transaction_volume),"XOF"],["Commissions",money(summary.commission_revenue_total??summary.commissions),"Revenus"],["Dépôts",money(summary.deposits_volume_successful),"Réussis"],["Retraits",money(summary.withdrawals_volume_successful),"Réussis"],["Litiges",summary.disputes_open??summary.open_disputes,"Ouverts"],["Support",summary.support_tickets_open??0,"Tickets ouverts"]];const max=Math.max(1,...analytics.map(x=>Number(x.transaction_volume??0)));return <div className="sp-dashboard-view"><div className="sp-welcome"><div><span>VUE GÉNÉRALE</span><h2>Bonjour, administrateur 👋</h2><p>Surveillez les opérations SafePay depuis un seul espace.</p></div><span className="sp-secure-pill">● Données en direct</span></div><section className="sp-kpi-grid">{cards.map(([l,v,s])=><div className="sp-kpi" key={l}><div className="sp-kpi-top"><span>{l}</span><b>{iconForKpi(l)}</b></div><strong>{typeof v==="number"?v.toLocaleString("fr-FR"):String(v)}</strong><small>{s}</small></div>)}</section><div className="sp-main-grid"><section className="sp-panel sp-chart-panel"><div className="sp-panel-head"><div><h3>Volume des transactions</h3><p>Activité réelle sur la période sélectionnée</p></div><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={365}>12 mois</option></select></div><div className="sp-chart-large">{analytics.length===0?<div className="sp-empty">Aucune donnée disponible pour cette période.</div>:analytics.map(x=><div className="sp-bar-col" key={String(x.date)} title={`${x.date} ${money(x.transaction_volume)}`}><div className="sp-bar" style={{height:`${Math.max(4,Number(x.transaction_volume??0)/max*100)}%`}}/><small>{String(x.date).slice(5)}</small></div>)}</div></section><section className="sp-panel"><div className="sp-panel-head"><div><h3>État de la plateforme</h3><p>Indicateurs de surveillance</p></div></div><div className="sp-health"><div><span>Wallets actifs</span><strong>{value(summary.wallets_total??summary.wallets)}</strong></div><div><span>Solde total</span><strong>{money(summary.wallets_total_balance)}</strong></div><div><span>Fonds bloqués</span><strong>{money(summary.wallets_total_locked)}</strong></div><div><span>Retraits en attente</span><strong>{value(summary.withdrawals_pending_count??summary.pending_withdrawals)}</strong></div></div></section></div></div>}
function iconForKpi(l:string){return l==="Utilisateurs"?"♙":l==="Transactions"?"⇄":l==="Volume"?"◈":l==="Commissions"?"%":l==="Dépôts"?"↓":l==="Retraits"?"↑":l==="Litiges"?"⚖":"?"}

function DataModule({active,rows,columns,total,page,size,search,setSearch,status,setStatus,setPage,action}:{active:Module;rows:Row[];columns:string[];total:number;page:number;size:number;search:string;setSearch:(s:string)=>void;status:string;setStatus:(s:string)=>void;setPage:(n:number)=>void;action:(r:Row)=>React.ReactNode}){const statuses=["pending","processing","successful","failed","cancelled","open","resolved","closed","funded","delivered","completed","disputed"];return <section className="sp-data-page"><div className="sp-data-toolbar"><div><h2>{modules.find(x=>x[0]===active)?.[1]}</h2><span>{total} enregistrement(s) · données Supabase</span></div><div className="sp-toolbar-controls"><input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Rechercher…"/>{["transactions","deposits","withdrawals","disputes","support"].includes(active)&&<select value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="">Tous les statuts</option>{statuses.map(x=><option key={x} value={x}>{x}</option>)}</select>}</div></div><div className="sp-table-card"><div className="sp-table-wrap"><table className="sp-admin-table"><thead><tr>{columns.map(c=><th key={c}>{c.replaceAll("_"," ")}</th>)}<th>Action</th></tr></thead><tbody>{rows.length===0?<tr><td colSpan={columns.length+1}><div className="sp-empty">Aucune donnée.</div></td></tr>:rows.map((r,i)=><tr key={String(r.id??r.user_id??i)}>{columns.map(c=><td key={c}>{value(r[c])}</td>)}<td className="sp-actions">{action(r)}</td></tr>)}</tbody></table></div><footer className="sp-table-footer"><span>Page {page+1} · {Math.min(size,total-page*size)} affichés</span><div><button className="safepay-secondary" disabled={page===0} onClick={()=>setPage(page-1)}>← Précédent</button><button className="safepay-secondary" disabled={(page+1)*size>=total} onClick={()=>setPage(page+1)}>Suivant →</button></div></footer></div></section>}

function Settings({settings,setSettings,rpc}:{settings:Setting[];setSettings:React.Dispatch<React.SetStateAction<Setting[]>>;rpc:(n:string,a:Record<string,unknown>)=>Promise<void>}){return <div className="sp-data-page"><div className="sp-data-toolbar"><div><h2>Paramètres de la plateforme</h2><span>Valeurs backend · modifications auditées</span></div></div><section className="sp-settings-grid">{settings.map(s=><article className="sp-setting-card" key={s.key}><div><span className="sp-setting-key">{s.key}</span><h3>{s.label}</h3><p>{s.description}</p></div>{s.type==="number"?<div className="sp-setting-edit"><input type="number" value={String(s.value)} onChange={e=>setSettings(a=>a.map(x=>x.key===s.key?{...x,value:Number(e.target.value)}:x))}/><b>{s.unit}</b><button className="safepay-primary" onClick={()=>rpc("admin_set_app_setting",{p_key:s.key,p_value_numeric:Number(s.value),p_value_text:null,p_value_boolean:null,p_reason:"Modification Admin"})}>Enregistrer</button></div>:<button className={s.value?"sp-toggle on":"sp-toggle"} onClick={()=>{const v=!Boolean(s.value);setSettings(a=>a.map(x=>x.key===s.key?{...x,value:v}:x));rpc("admin_set_app_setting",{p_key:s.key,p_value_numeric:null,p_value_text:null,p_value_boolean:v,p_reason:"Modification Admin"})}}><i/>{s.value?"Activé":"Désactivé"}</button>}</article>)}</section></div>}

function Features({state,setState,rpc}:{state:Record<string,boolean>;setState:React.Dispatch<React.SetStateAction<Record<string,boolean>>>;rpc:(n:string,a:Record<string,unknown>)=>Promise<void>}){return <div className="sp-data-page"><div className="sp-data-toolbar"><div><h2>Feature Flags</h2><span>Activation contrôlée des fonctionnalités</span></div></div><section className="sp-feature-grid">{flags.map(k=><article className="sp-setting-card" key={k}><div><span className="sp-setting-key">FEATURE</span><h3>{k}</h3><p>État lu depuis feature_flags.</p></div><button className={state[k]?"sp-toggle on":"sp-toggle"} onClick={()=>{const v=!Boolean(state[k]);setState(a=>({...a,[k]:v}));rpc("admin_set_feature_flag",{p_key:k,p_enabled:v,p_reason:"Modification Admin"})}}><i/>{state[k]?"Activé":"Désactivé"}</button></article>)}</section></div>}
function NotificationForm({rpc}:{rpc:(n:string,a:Record<string,unknown>)=>Promise<void>}){const [user,setUser]=useState("");const [title,setTitle]=useState("");const [body,setBody]=useState("");return <div className="sp-data-page"><div className="sp-data-toolbar"><div><h2>Notifications</h2><span>Envoi via le backend SafePay</span></div></div><section className="sp-panel sp-form-panel"><label>Utilisateur cible<input value={user} onChange={e=>setUser(e.target.value)} placeholder="UUID utilisateur"/></label><label>Titre<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre"/></label><label>Message<textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} placeholder="Votre message"/></label><button className="safepay-primary" disabled={!user||!title||!body} onClick={()=>rpc("admin_send_notification",{p_user_id:user,p_title:title,p_message:body})}>Envoyer la notification</button></section></div>}
function Security(){return <div className="sp-data-page"><div className="sp-data-toolbar"><div><h2>Sécurité Admin</h2><span>Contrôles de sécurité du centre d'administration</span></div></div><section className="sp-security-cards"><article><b>✓</b><h3>Auth Supabase</h3><p>Connexion obligatoire avant contrôle du rôle.</p></article><article><b>✓</b><h3>is_admin()</h3><p>L'autorisation Admin est vérifiée côté backend.</p></article><article><b>✓</b><h3>RLS</h3><p>Les tables sensibles restent protégées par Supabase.</p></article><article><b>!</b><h3>Audit</h3><p>Les changements sensibles passent par les fonctions Admin et audit_logs.</p></article></section></div>}
