"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SAFE_PAY_COUNTRIES, onlyPhoneCharacters, validatePhone } from "@/lib/phone";

type Method = { provider_id:string; provider_name:string; provider_code:string; method_id:string; method_name:string; method_code:string; currency:string; collection_fee_percent:number|string; collection_fee_fixed:number|string; payout_fee_percent:number|string; payout_fee_fixed:number|string };
type Fees = { gross_amount:number; provider_collection_fee:number; safepay_fee:number; payout_fee:number; total_customer_fee:number; buyer_total:number; escrow_amount:number; seller_net:number; provider_revenue:number; safepay_revenue:number; fee_payer:"buyer"|"seller"|"split"; payment_method:string|null };

const money = (n:number) => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"XOF", maximumFractionDigits:0 }).format(n);

export default function NewTransactionPage() {
  const router = useRouter();
  const [sellerPhone,setSellerPhone]=useState(""); const [sellerCountry,setSellerCountry]=useState("TG"); const [description,setDescription]=useState(""); const [amount,setAmount]=useState(""); const [deliveryDelay,setDeliveryDelay]=useState(""); const [conditions,setConditions]=useState("");
  const [methods,setMethods]=useState<Method[]>([]); const [methodId,setMethodId]=useState(""); const [fees,setFees]=useState<Fees|null>(null); const [busy,setBusy]=useState(false); const [loadingFees,setLoadingFees]=useState(false); const [error,setError]=useState("");

  useEffect(()=>{ (async()=>{ const s=createClient(); const {data}=await s.rpc("get_active_payment_methods",{p_currency:"XOF",p_country:sellerCountry}); setMethods((data??[]) as Method[]); })(); },[sellerCountry]);
  useEffect(()=>{ const run=async()=>{ const n=Number(amount); if(!Number.isFinite(n)||n<=0){setFees(null);return;} setLoadingFees(true); const s=createClient(); const m=methods.find(x=>x.method_id===methodId); const {data,error:e}=await s.rpc("calculate_transaction_fees",{p_amount:n,p_currency:"XOF",p_provider_id:m?.provider_id??null,p_payment_method_id:m?.method_id??null}); setLoadingFees(false); if(!e) setFees(data as Fees); }; const id=setTimeout(run,180); return()=>clearTimeout(id); },[amount,methodId,methods]);

  async function submit(event:FormEvent){ event.preventDefault(); setError(""); const n=Number(amount); const country=SAFE_PAY_COUNTRIES.find(c=>c.code===sellerCountry); const phoneResult=country?validatePhone(country.code,sellerPhone):{valid:false as const,e164:"",reason:"Pays invalide."}; if(!phoneResult.valid||!description.trim()||!Number.isFinite(n)||n<=0){setError(phoneResult.valid?"Vérifiez la description et le montant.":phoneResult.reason);return;} setBusy(true); try{ const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)throw new Error("Session expirée. Reconnectez-vous."); const m=methods.find(x=>x.method_id===methodId); const {data:id,error:e}=await s.rpc("create_transaction_with_method",{p_seller_phone:phoneResult.e164,p_seller_country:country?.code??sellerCountry,p_description:description.trim(),p_amount:n,p_delivery_delay:deliveryDelay.trim()||null,p_conditions:conditions.trim()||null,p_provider_id:m?.provider_id??null,p_payment_method_id:m?.method_id??null}); if(e)throw e; router.replace(`/transactions/${id}`); }catch(err){setError(err instanceof Error?err.message:"Impossible de créer la transaction.");}finally{setBusy(false);} }

  const feePayer=fees?.fee_payer; const explanation=feePayer==="buyer"?"Cette SafePay Protection couvre le paiement sécurisé, la protection escrow, le suivi de la transaction et la gestion des litiges.":feePayer==="seller"?"Cette SafePay Protection couvre le service de transaction sécurisé, l'escrow, le suivi et la gestion des litiges. Elle est prélevée sur votre montant vendeur.":"Le coût de protection SafePay est partagé entre l'acheteur et le vendeur pour couvrir le paiement sécurisé, l'escrow, le suivi et les litiges.";

  return <main className="safepay-shell safepay-dashboard"><header className="sp-header"><button className="sp-back" onClick={()=>router.back()} aria-label="Retour">←</button><strong>Nouvelle transaction</strong><span style={{width:36}}/></header><section className="sp-content"><p className="sp-eyebrow">Escrow SafePay</p><h1 className="sp-title">Créer une transaction sécurisée</h1>
    <form className="sp-form" onSubmit={submit}>
      <label>Pays du vendeur<select value={sellerCountry} onChange={e=>setSellerCountry(e.target.value)}>{SAFE_PAY_COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name} ({c.callingCode})</option>)}</select></label>
      <label>Numéro du vendeur<input value={sellerPhone} onChange={e=>setSellerPhone(onlyPhoneCharacters(e.target.value))} placeholder="90 00 00 00" inputMode="tel" autoComplete="tel"/></label>
      <label>Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex. Achat d'un téléphone"/></label>
      <label>Montant (XOF)<input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,""))} placeholder="25000" inputMode="numeric"/></label>
      <label>Mode de paiement<select value={methodId} onChange={e=>setMethodId(e.target.value)}><option value="">Selon le Wallet SafePay</option>{methods.map(m=><option key={m.method_id} value={m.method_id}>{m.provider_name} — {m.method_name}</option>)}</select></label>
      {loadingFees&&<div className="sp-muted" style={{padding:"8px 0"}}>◔ Calcul des frais…</div>}
      {fees&&<section className="sp-section-card" style={{marginTop:4}}><h2>Récapitulatif des frais</h2><div className="sp-detail-grid"><div><span>Prix</span><strong>{money(fees.gross_amount)}</strong></div><div><span>Frais prestataire</span><strong>{money(fees.provider_collection_fee)}</strong></div><div><span>Protection SafePay</span><strong>{money(fees.safepay_fee)}</strong></div><div><span>Total acheteur</span><strong>{money(fees.buyer_total)}</strong></div><div><span>Montant escrow</span><strong>{money(fees.escrow_amount)}</strong></div><div><span>Vendeur recevra</span><strong>{money(fees.seller_net)}</strong></div></div><p style={{marginTop:14,fontSize:13,color:"#8094aa"}}><b>Pourquoi ce frais ?</b><br/>{explanation}</p><p style={{marginTop:8,fontSize:12,color:"#8094aa"}}>Le montant final et la répartition sont calculés par le backend selon la configuration financière active du Dashboard Admin.</p></section>}
      <label>Délai de livraison <span className="sp-label-optional">(optionnel)</span><input value={deliveryDelay} onChange={e=>setDeliveryDelay(e.target.value)} placeholder="Ex. 48 heures"/></label>
      <label>Conditions <span className="sp-label-optional">(optionnel)</span><textarea value={conditions} onChange={e=>setConditions(e.target.value)} placeholder="Conditions convenues avec le vendeur" rows={4}/></label>
      {error&&<p className="sp-form-error" role="alert">{error}</p>}
      <button className="safepay-primary sp-submit" disabled={busy}>{busy?"Création…":"Créer la transaction"}</button>
    </form></section></main>;
}
