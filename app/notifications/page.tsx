"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";

type NotificationItem = { id: string; title: string; message: string | null; is_read: boolean; created_at: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée. Reconnectez-vous."); setLoading(false); return; }
    const { data, error: queryError } = await supabase.from("notifications").select("id,title,message,is_read,created_at").order("created_at", { ascending: false }).limit(50);
    if (queryError) setError(queryError.message); else setItems((data ?? []) as NotificationItem[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (updateError) { setError(updateError.message); return; }
    setItems(current => current.map(item => item.id === id ? { ...item, is_read: true } : item));
  }

  return <AppShell><section className="sp-page"><p className="sp-eyebrow">SafePay</p><h1 className="sp-title">Notifications</h1>{loading ? <section className="sp-section-card"><p className="sp-muted">Chargement…</p></section> : error ? <section className="sp-section-card"><p className="sp-form-error">{error}</p></section> : items.length === 0 ? <section className="sp-section-card sp-empty-list"><strong>Aucune notification</strong><span>Les nouvelles alertes SafePay apparaîtront ici.</span></section> : <section className="sp-notification-list">{items.map(item => <button key={item.id} className={`sp-notification-row${item.is_read ? " read" : ""}`} onClick={() => !item.is_read && markRead(item.id)}><span className="sp-notification-dot"/><span><strong>{item.title}</strong><small>{item.message ?? ""}</small><small>{new Date(item.created_at).toLocaleString("fr-FR")}</small></span></button>)}</section>}</section></AppShell>;
}
