import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const money = (v: unknown) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(v ?? 0));
const display = (v: unknown) => v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/users/${encodeURIComponent(id)}`);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const [{ data: profiles, error: profileError }, { data: wallet }, { data: account }, { data: txs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("wallets").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("accounts").select("*").eq("user_id", id).maybeSingle(),
    supabase.rpc("admin_list_transactions", { p_search: id, p_status: null, p_limit: 25, p_offset: 0 }),
  ]);
  if (profileError || !profiles) notFound();
  const profile = profiles as Row;
  const transactions = Array.isArray(txs) ? txs as Row[] : ((txs as Row | null)?.items as Row[] | undefined) ?? [];

  return <main className="safepay-shell"><style>{`.admin-detail{max-width:1100px;margin:0 auto;padding:20px}.admin-back{display:inline-block;margin-bottom:16px}.admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.admin-card{border:1px solid var(--sp-line);border-radius:18px;padding:16px;background:var(--sp-card,#fff)}.admin-card h2{margin:0 0 12px;font-size:16px}.admin-kv{display:grid;grid-template-columns:1fr 1fr;gap:8px}.admin-kv div{padding:10px;border-radius:12px;background:var(--sp-soft)}.admin-kv small{display:block;color:var(--sp-muted);font-size:10px}.admin-kv strong{display:block;margin-top:4px;word-break:break-word}.admin-table{width:100%;border-collapse:collapse;font-size:11px}.admin-table th,.admin-table td{text-align:left;padding:9px;border-bottom:1px solid var(--sp-line)}@media(max-width:700px){.admin-grid{grid-template-columns:1fr}.admin-kv{grid-template-columns:1fr}}`}</style><section className="admin-detail">
    <a className="admin-back safepay-secondary" href="/admin">← Dashboard Admin</a>
    <p className="sp-eyebrow">Fiche utilisateur</p><h1 className="sp-title">{display(profile.full_name ?? profile.name ?? profile.phone ?? id)}</h1>
    <p className="sp-muted">Lecture sécurisée par Supabase · aucun secret serveur n'est exposé au navigateur.</p>
    <div className="admin-grid">
      <section className="admin-card"><h2>Profil</h2><div className="admin-kv">{Object.entries(profile).slice(0,12).map(([k,v])=><div key={k}><small>{k.replaceAll("_"," ")}</small><strong>{display(v)}</strong></div>)}</div></section>
      <section className="admin-card"><h2>Wallet</h2><div className="admin-kv">{wallet ? Object.entries(wallet as Row).slice(0,12).map(([k,v])=><div key={k}><small>{k.replaceAll("_"," ")}</small><strong>{k.includes("balance") || k === "amount" ? money(v) : display(v)}</strong></div>) : <p className="sp-muted">Aucun wallet trouvé.</p>}</div></section>
      <section className="admin-card"><h2>Compte</h2><div className="admin-kv">{account ? Object.entries(account as Row).slice(0,12).map(([k,v])=><div key={k}><small>{k.replaceAll("_"," ")}</small><strong>{display(v)}</strong></div>) : <p className="sp-muted">Aucun compte associé.</p>}</div></section>
      <section className="admin-card"><h2>Transactions</h2>{transactions.length ? <div style={{overflowX:"auto"}}><table className="admin-table"><thead><tr>{Object.keys(transactions[0]).slice(0,6).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{transactions.map((r,i)=><tr key={String(r.id??i)}>{Object.keys(transactions[0]).slice(0,6).map(k=><td key={k}>{display(r[k])}</td>)}</tr>)}</tbody></table></div> : <p className="sp-muted">Aucune transaction trouvée.</p>}</section>
    </div>
  </section></main>;
}
