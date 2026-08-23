"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/navigation/AppShell";
import { createClient } from "@/lib/supabase/client";
import { getNotificationSoundEnabled } from "@/lib/preferences";
import { playNotificationSound } from "@/lib/notificationSound";

type NotificationItem = { id: string; title: string; message: string | null; is_read: boolean; created_at: string; user_id?: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const knownIds = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { setError("Session expirée. Reconnectez-vous."); setLoading(false); return; }
      const { data, error: queryError } = await supabase.from("notifications").select("id,user_id,title,message,is_read,created_at").order("created_at", { ascending: false }).limit(50);
      if (!active) return;
      if (queryError) setError(queryError.message); else {
        const next = (data ?? []) as NotificationItem[];
        knownIds.current = new Set(next.map(item => item.id));
        setItems(next);
      }
      setLoading(false);
      channel = supabase.channel(`safepay-notifications-${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, async (payload) => {
          const item = payload.new as NotificationItem;
          if (!active || knownIds.current.has(item.id)) return;
          knownIds.current.add(item.id);
          setItems(current => [item, ...current].slice(0, 50));
          if (getNotificationSoundEnabled()) await playNotificationSound();
        })
        .subscribe();
    };
    void load();
    return () => { active = false; if (channel) { void supabaseRemoveChannel(channel); } };
  }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    const { error: updateError } = await supabase.rpc("mark_notification_read", { p_notification_id: id });
    if (updateError) { setError(updateError.message); return; }
    setItems(current => current.map(item => item.id === id ? { ...item, is_read: true } : item));
  }

  return <AppShell><section className="sp-page"><p className="sp-eyebrow">Centre d'alertes</p><h1 className="sp-title">Notifications</h1>{loading ? <section className="sp-section-card"><p className="sp-muted">Chargement…</p></section> : error ? <section className="sp-section-card"><p className="sp-form-error">{error}</p></section> : items.length === 0 ? <section className="sp-section-card sp-empty-list"><strong>Aucune notification</strong><span>Les nouvelles alertes apparaîtront ici.</span></section> : <section className="sp-notification-list">{items.map(item => <button key={item.id} className={`sp-notification-row${item.is_read ? " read" : ""}`} onClick={() => !item.is_read && markRead(item.id)}><span className="sp-notification-dot"/><span><strong>{item.title}</strong><small>{item.message ?? ""}</small><small>{new Date(item.created_at).toLocaleString("fr-FR")}</small></span></button>)}</section>}</section></AppShell>;
}

async function supabaseRemoveChannel(channel: ReturnType<ReturnType<typeof createClient>["channel"]>) {
  const supabase = createClient();
  await supabase.removeChannel(channel);
}
