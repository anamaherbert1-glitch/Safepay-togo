"use client";
import { useEffect, useState } from "react";

const base:React.CSSProperties={background:"linear-gradient(135deg,#06101f 0%,#081a32 52%,#06101f 100%)",color:"#f4f8ff",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif"};
const card:React.CSSProperties={background:"rgba(10,24,43,.88)",border:"1px solid rgba(82,168,255,.14)",borderRadius:20,padding:22,boxShadow:"0 18px 55px rgba(0,0,0,.18)"};
const input:React.CSSProperties={width:"100%",background:"#071525",color:"#edf6ff",border:"1px solid rgba(148,163,184,.18)",borderRadius:11,padding:"12px 13px",outline:"none"};

export default function AdminSettings(){
 const [theme,setTheme]=useState("dark"),[language,setLanguage]=useState("fr"),[currency,setCurrency]=useState("XOF"),[message,setMessage]=useState("");
 useEffect(()=>{setTheme(localStorage.getItem("safepay-admin-theme")||"dark");setLanguage(localStorage.getItem("safepay-admin-language")||"fr");setCurrency(localStorage.getItem("safepay-admin-currency")||"XOF")},[]);
 function savePref(key:string,value:string){localStorage.setItem(key,value);setMessage("Préférence enregistrée.");if(key.endsWith("theme")){document.documentElement.dataset.adminTheme=value;document.documentElement.dataset.adminThemeResolved=value}}
 return <main style={base}><div style={{maxWidth:980,margin:"0 auto",padding:"28px 22px 48px"}}><a href="/admin" style={{color:"#7fc0ff",textDecoration:"none",fontSize:13}}>← Retour au Dashboard</a><header style={{margin:"24px 0 20px"}}><div style={{color:"#59a9ff",fontSize:11,fontWeight:900,letterSpacing:".18em"}}>CONFIGURATION • PRÉFÉRENCES</div><h1 style={{fontSize:36,margin:"8px 0"}}>Paramètres SafePay Admin</h1><p style={{color:"#8fa6bf",maxWidth:720}}>Ici se trouvent uniquement les préférences générales du dashboard : thème, langue et devise d'affichage.</p></header>
 <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16}}>
  <section style={card}><div style={{fontSize:26}}>◐</div><h2>Thème</h2><p style={{color:"#8fa6bf",fontSize:13}}>Choisis une interface sombre, claire ou synchronisée avec le système.</p><select value={theme} onChange={e=>{setTheme(e.target.value);savePref("safepay-admin-theme",e.target.value)}} style={{...input,marginTop:12}}><option value="dark">Sombre</option><option value="light">Clair</option><option value="system">Système</option></select></section>
  <section style={card}><div style={{fontSize:26}}>文</div><h2>Langue</h2><p style={{color:"#8fa6bf",fontSize:13}}>Langue d'affichage du tableau de bord administrateur.</p><select value={language} onChange={e=>{setLanguage(e.target.value);savePref("safepay-admin-language",e.target.value)}} style={{...input,marginTop:12}}><option value="fr">Français</option><option value="en">English</option></select></section>
  <section style={card}><div style={{fontSize:26}}>¤</div><h2>Devise</h2><p style={{color:"#8fa6bf",fontSize:13}}>Devise d'affichage globale du dashboard.</p><select value={currency} onChange={e=>{setCurrency(e.target.value);savePref("safepay-admin-currency",e.target.value)}} style={{...input,marginTop:12}}><option value="XOF">XOF — Franc CFA</option><option value="EUR">EUR — Euro</option><option value="USD">USD — Dollar US</option></select></section>
 </div>{message&&<p style={{marginTop:16,color:"#7fe0ac"}}>{message}</p>}</div></main>;
}
