import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const money = (v: unknown) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const display = (v: unknown) => v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);

export default async function AdminTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/transactions/${encodeURIComponent(id)}`);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const { data, error } = await supabase.rpc("admin_list_transactions", { p_search: id, p_status: null, p_limit: 10, p_offset: 0 });
  if (error) throw new Error(error.message);
  const items = Array.isArray(data) ? data as Row[] : ((data as Row | null)?.items as Row[] | undefined) ?? [];
  const transaction = items.find(x => String(x.id ?? x.transaction_id) === id) ?? items[0];
  if (!transaction) notFound();

  const { data: history } = await supabase.from("transaction_status_history").select("*").eq("transaction_id", String(transaction.id ?? id)).order("created_at", { ascending: true });
  const { data: fees } = await supabase.from("platform_fees").select("*").eq("transaction_id", String(transaction.id ?? id)).order("created_at", { ascending: true });

  const status = String(transaction.status ?? "").toLowerCase();
  const steps = ["created", "funded", "delivered", "completed"];
  const current = status === "pending" ? 0 : status === "funded" ? 1 : status === "delivered" ? 2 : status === "completed" ? 3 : -1;

  return <main className="safepay-shell"><style>{`.tx-detail{max-width:1100px;margin:0 auto;padding:20px}.tx-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}.tx-card{border:1px solid var(--sp-line);border-radius:18px;padding:16px;background:var(--sp-card,#fff)}.tx-card h2{margin:0 0 12px;font-size:16px}.tx-kv{display:grid;grid-template-columns:1fr 1fr;gap:8px}.tx-kv div{padding:10px;border-radius:12px;background:var(--sp-soft)}.tx-kv small{display:block;color:var(--sp-muted);font-size:10px}.tx-kv strong{display:block;margin-top:4px;word-break:break-word}.tx-timeline{display:grid;gap:8px}.tx-step{display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--sp-line);border-radius:12px}.tx-dot{width:10px;height:10px;border-radius:50%;background:var(--sp-line)}.tx-step.done .tx-dot{background:var(--sp-primary)}.tx-table{width:100%;border-collapse:collapse;font-size:11px}.tx-table th,.tx-table td{text-align:left;padding:9px;border-bottom:1px solid var(--sp-line)}@media(max-width:750px){.tx-grid{grid-template-columns:1fr}.tx-kv{grid-template-columns:1fr}}`}</style><section className="tx-detail">
    <a className="safepay-secondary" href="/admin">← Dashboard Admin</a>
    <p className="sp-eyebrow" style={{marginTop:18}}>Détail transaction</p><h1 className="sp-title">{id}</h1><p className="sp-muted">Lecture backend sécurisée · aucune modification de l'escrow depuis React.</p>
    <div className="tx-grid">
      <section className="tx-card"><h2>Informations transaction</h2><div className="tx-kv">{Object.entries(transaction).slice(0,16).map(([k,v])=><div key={k}><small>{k.replaceAll("_"," ")}</small><strong>{k.includes("amount") || k.includes("fee") || k.includes("volume") ? money(v) : display(v)}</strong></div>)}</div></section>
      <section className="tx-card"><h2>Escrow / statut</h2><div className="tx-timeline">{steps.map((step,index)=><div className={`tx-step ${current>=index?"done":""}`} key={step}><span className="tx-dot"/><strong>{step}</strong></div>)}</div><p className="sp-muted" style={{marginTop:12}}>Statut actuel : <strong>{status || "—"}</strong></p></section>
      <section className="tx-card"><h2>Historique des statuts</h2>{history?.length ? <div style={{overflowX:"auto"}}><table className="tx-table"><thead><tr>{Object.keys(history[0]).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{history.map((r,i)=><tr key={String(r.id??i)}>{Object.keys(history[0]).map(k=><td key={k}>{display(r[k])}</td>)}</tr>)}</tbody></table></div> : <p className="sp-muted">Aucun historique disponible.</p>}</section>
      <section className="tx-card"><h2>Frais plateforme</h2>{fees?.length ? <div style={{overflowX:"auto"}}><table className="tx-table"><thead><tr>{Object.keys(fees[0]).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{fees.map((r,i)=><tr key={String(r.id??i)}>{Object.keys(fees[0]).map(k=><td key={k}>{k.includes("amount") || k.includes("fee") ? money(r[k]) : display(r[k])}</td>)}</tr>)}</tbody></table></div> : <p className="sp-muted">Aucun frais enregistré.</p>}</section>
    </div>
  </section></main>;
}
