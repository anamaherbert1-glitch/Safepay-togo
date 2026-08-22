"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";

type Ticket = { id: string; message: string; status: string; created_at: string; updated_at: string };
type SupportMessage = { id: string; sender_id: string; sender_type: string; message: string; created_at: string };

const statusLabel: Record<string,string> = { open: "Ouvert", pending: "En attente", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newTicket, setNewTicket] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadTickets() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée. Reconnectez-vous."); setLoading(false); return; }
    const { data, error: queryError } = await supabase.from("support_tickets").select("id,message,status,created_at,updated_at").order("updated_at", { ascending: false });
    if (queryError) setError(queryError.message); else setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  }

  async function loadMessages(ticketId: string) {
    const supabase = createClient();
    const { data, error: queryError } = await supabase.from("support_messages").select("id,sender_id,sender_type,message,created_at").eq("ticket_id", ticketId).order("created_at", { ascending: true });
    if (queryError) setError(queryError.message); else setMessages((data ?? []) as SupportMessage[]);
  }

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { if (selected) loadMessages(selected.id); else setMessages([]); }, [selected?.id]);

  async function createTicket() {
    const text = newTicket.trim();
    if (!text) return setError("Décrivez votre demande.");
    setBusy(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée. Reconnectez-vous."); setBusy(false); return; }
    const { data: ticket, error: ticketError } = await supabase.from("support_tickets").insert({ user_id: user.id, message: text }).select("id,message,status,created_at,updated_at").single();
    if (ticketError || !ticket) { setError(ticketError?.message ?? "Impossible de créer le ticket."); setBusy(false); return; }
    await supabase.from("support_messages").insert({ ticket_id: ticket.id, sender_id: user.id, sender_type: "user", message: text });
    setNewTicket("");
    await loadTickets();
    setSelected(ticket as Ticket);
    setBusy(false);
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setBusy(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée. Reconnectez-vous."); setBusy(false); return; }
    const { error: sendError } = await supabase.from("support_messages").insert({ ticket_id: selected.id, sender_id: user.id, sender_type: "user", message: reply.trim() });
    if (sendError) setError(sendError.message); else { setReply(""); await loadMessages(selected.id); }
    setBusy(false);
  }

  return <AppShell><section className="sp-page"><p className="sp-eyebrow">Assistance SafePay</p><h1 className="sp-title">Support</h1>
    <section className="sp-section-card"><div className="sp-section-head"><h2>Nouvelle demande</h2></div><div className="sp-form" style={{marginTop:10}}><textarea rows={4} value={newTicket} onChange={e=>setNewTicket(e.target.value)} placeholder="Décrivez votre problème ou votre question…"/><button className="safepay-primary sp-submit" disabled={busy} onClick={createTicket}>{busy ? "Envoi…" : "Contacter SafePay"}</button></div></section>
    {loading ? <section className="sp-section-card"><p className="sp-muted">Chargement…</p></section> : tickets.length === 0 ? <section className="sp-section-card sp-empty-list"><strong>Aucun ticket</strong><span>Vos échanges avec l'équipe SafePay apparaîtront ici.</span></section> : <section className="sp-section-card"><div className="sp-section-head"><h2>Mes demandes</h2></div><div className="sp-notification-list">{tickets.map(ticket=><button key={ticket.id} className={`sp-notification-row${selected?.id===ticket.id?" read":""}`} onClick={()=>setSelected(ticket)}><span className="sp-notification-dot"/><span><strong>{ticket.message}</strong><small>{statusLabel[ticket.status]??ticket.status} · {new Date(ticket.updated_at).toLocaleString("fr-FR")}</small></span></button>)}</div></section>}
    {selected && <section className="sp-section-card"><div className="sp-section-head"><h2>Conversation</h2><button onClick={()=>setSelected(null)}>Fermer</button></div><div className="sp-notification-list" style={{marginTop:12}}>{messages.map(message=><div key={message.id} className="sp-notification-row" style={{opacity:1}}><span className="sp-notification-dot"/><span><strong>{message.sender_type === "admin" ? "SafePay" : "Vous"}</strong><small>{message.message}</small><small>{new Date(message.created_at).toLocaleString("fr-FR")}</small></span></div>)}</div><div className="sp-form" style={{marginTop:12}}><textarea rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Votre réponse…"/><button className="safepay-primary sp-submit" disabled={busy || !reply.trim()} onClick={sendReply}>Envoyer</button></div></section>}
    {error && <p className="sp-form-error" role="alert">{error}</p>}
  </section></AppShell>;
}
