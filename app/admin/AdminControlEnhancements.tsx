"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = Record<string, any>;
type Active = "users" | "disputes" | "support" | "audit" | "other";

const css: Record<string, React.CSSProperties> = {
  modal: { position: "fixed", inset: 0, zIndex: 120, background: "rgba(2,8,18,.76)", display: "grid", placeItems: "center", padding: 18 },
  panel: { width: "min(920px,100%)", maxHeight: "88vh", overflow: "auto", background: "#0b1a2d", color: "#eef6ff", border: "1px solid rgba(96,177,255,.2)", borderRadius: 20, padding: 22, boxShadow: "0 28px 90px rgba(0,0,0,.45)" },
  input: { width: "100%", boxSizing: "border-box", background: "#071525", color: "#edf6ff", border: "1px solid rgba(148,163,184,.18)", borderRadius: 10, padding: "11px 12px" },
  primary: { background: "linear-gradient(135deg,#1984ff,#1261df)", color: "#fff", border: 0, borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" },
  secondary: { background: "transparent", color: "#c6d4e3", border: "1px solid rgba(148,163,184,.22)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" },
};

function activeModule(): Active {
  const buttons = Array.from(document.querySelectorAll(".adm-sidebar nav button"));
  const active = buttons.find((b) => b.classList.contains("active"))?.textContent?.toLowerCase() || "";
  if (active.includes("utilisateurs")) return "users";
  if (active.includes("litiges")) return "disputes";
  if (active.includes("support")) return "support";
  if (active.includes("audit")) return "audit";
  return "other";
}

export default function AdminControlEnhancements() {
  const [active, setActive] = useState<Active>("other");
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [evidence, setEvidence] = useState<Row[]>([]);
  const [events, setEvents] = useState<Row[]>([]);
  const [supportMessages, setSupportMessages] = useState<Row[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resolution, setResolution] = useState("refund_buyer");
  const [resolutionText, setResolutionText] = useState("");

  useEffect(() => {
    const check = () => setActive(activeModule());
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (active !== "users" && active !== "disputes" && active !== "support") return;
    const s = createClient();
    let cancelled = false;
    (async () => {
      let r: any;
      if (active === "users") r = await s.rpc("admin_list_users", { p_search: null, p_limit: 100, p_offset: 0 });
      if (active === "disputes") r = await s.rpc("admin_list_disputes", { p_status: null, p_limit: 100, p_offset: 0 });
      if (active === "support") r = await s.rpc("admin_list_support_tickets", { p_status: null, p_limit: 100, p_offset: 0 });
      if (!cancelled && !r?.error) {
        const data = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.items) ? r.data.items : [];
        const rows = document.querySelectorAll(".adm-main table tbody tr");
        rows.forEach((tr, i) => {
          const row = data[i];
          if (!row) return;
          (tr as HTMLElement).style.cursor = "pointer";
          (tr as HTMLElement).onclick = (ev) => {
            if ((ev.target as HTMLElement)?.closest("button,a,input,select")) return;
            setSelected(row);
            setDetail(null);
            setSupportMessages([]);
            setDraft("");
            setNotice("");
            if (active === "disputes") void openDispute(row);
            if (active === "support") void openSupport(row);
          };
        });
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  async function openDispute(row: Row) {
    const s = createClient();
    setSelected(row); setDetail(null); setEvidence([]); setEvents([]); setDraft(""); setNotice("");
    const [d, e, ev] = await Promise.all([
      s.from("disputes").select("*").eq("id", row.id).maybeSingle(),
      s.from("dispute_events").select("*").eq("dispute_id", row.id).order("created_at", { ascending: true }),
      s.from("dispute_evidence").select("id,submitted_by,file_path,file_url,media_type,caption,created_at").eq("dispute_id", row.id).order("created_at", { ascending: true }),
    ]);
    if (d.data) setDetail(d.data);
    if (e.data) setEvents(e.data);
    if (ev.data) setEvidence(ev.data);
    if (d.error) setNotice(d.error.message);
  }

  async function openSupport(row: Row) {
    setSelected(row); setDraft(""); setNotice(""); setSupportMessages([]);
    const r = await createClient().rpc("admin_get_support_ticket_detail", { p_ticket_id: row.id });
    if (r.error) setNotice(r.error.message);
    else setSupportMessages(Array.isArray(r.data?.messages) ? r.data.messages : []);
  }

  async function resolveDispute() {
    if (!selected?.id) return;
    setBusy(true); setNotice("");
    const r = await createClient().rpc("admin_resolve_dispute", { p_dispute_id: selected.id, p_resolution: resolutionText.trim() || "Décision administrative SafePay", p_resolution_action: resolution });
    setBusy(false);
    if (r.error) setNotice(r.error.message); else setNotice("Litige traité et décision enregistrée dans SafePay.");
  }

  async function sendSupport() {
    if (!selected?.id || !draft.trim()) return;
    setBusy(true); setNotice("");
    const sent = draft.trim();
    const r = await createClient().rpc("admin_send_support_message", { p_ticket_id: selected.id, p_message: sent });
    if (r.error) {
      setNotice(r.error.message);
    } else {
      setDraft("");
      const fresh = await createClient().rpc("admin_get_support_ticket_detail", { p_ticket_id: selected.id });
      if (!fresh.error) setSupportMessages(Array.isArray(fresh.data?.messages) ? fresh.data.messages : []);
      setNotice("Réponse envoyée et ajoutée à l’historique.");
    }
    setBusy(false);
  }

  const userFields = useMemo(() => selected ? [
    ["ID utilisateur", selected.id], ["Nom", selected.full_name ?? selected.name], ["Téléphone", selected.phone], ["Pays", selected.country], ["Rôle", selected.role], ["Téléphone vérifié", selected.phone_verified ? "Oui" : "Non"], ["Compte", selected.is_active ? "Actif" : "Inactif"], ["Créé le", selected.created_at ? new Date(selected.created_at).toLocaleString("fr-FR") : "—"],
  ] : [], [selected]);

  return <>
    <style>{`.adm-sidebar nav button{ } .safepay-audit-trigger{position:fixed;right:22px;top:22px;z-index:70;width:40px;height:40px;border-radius:12px;border:1px solid rgba(148,163,184,.2);background:#0b1a2d;color:#dbeafe;font-size:21px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.2)} @media(max-width:600px){.safepay-audit-trigger{right:12px;top:12px}}`}</style>
    <button className="safepay-audit-trigger" aria-label="Plus d'options" onClick={() => setMenu((v) => !v)}>⋯</button>
    {menu && <div style={{ position: "fixed", right: 22, top: 68, zIndex: 71, background: "#0b1a2d", border: "1px solid rgba(96,177,255,.2)", borderRadius: 12, padding: 8, minWidth: 190, boxShadow: "0 18px 50px rgba(0,0,0,.3)" }}><button style={{ ...css.secondary, width: "100%" }} onClick={() => { setMenu(false); window.dispatchEvent(new CustomEvent("safepay-admin-open-audit")); }}>Ouvrir les Audit Logs</button></div>}

    {active === "users" && selected && <div style={css.modal} onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><div style={css.panel}><header style={{ display: "flex", justifyContent: "space-between", gap: 15, alignItems: "start" }}><div><small style={{ color: "#59a9ff", fontWeight: 900, letterSpacing: ".14em" }}>FICHE UTILISATEUR</small><h2 style={{ margin: "6px 0" }}>{selected.full_name ?? selected.name ?? "Utilisateur"}</h2></div><button style={css.secondary} onClick={() => setSelected(null)}>Fermer</button></header><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 18 }}>{userFields.map(([k,v]) => <div key={k} style={{ padding: 14, borderRadius: 12, background: "#071525", border: "1px solid rgba(148,163,184,.12)" }}><small style={{ color: "#7f96af" }}>{k}</small><div style={{ marginTop: 5, fontWeight: 700, wordBreak: "break-word" }}>{String(v ?? "—")}</div></div>)}</div></div></div>}

    {active === "disputes" && selected && <div style={css.modal} onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><div style={css.panel}><header style={{ display: "flex", justifyContent: "space-between", gap: 15 }}><div><small style={{ color: "#59a9ff", fontWeight: 900, letterSpacing: ".14em" }}>CENTRE DE RÉSOLUTION</small><h2 style={{ margin: "6px 0" }}>Litige #{String(selected.id).slice(0,8)}</h2><div style={{ color: "#8fa6bf", fontSize: 13 }}>{selected.opened_by_name ?? "Client"} · {selected.opened_by_phone ?? "Téléphone indisponible"}</div></div><button style={css.secondary} onClick={() => setSelected(null)}>Fermer</button></header><div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: "#071525" }}><b>Problème</b><p style={{ whiteSpace: "pre-wrap", color: "#c8d5e4" }}>{detail?.description ?? selected.description ?? "—"}</p><div style={{ color: "#8fa6bf", fontSize: 12 }}>Motif : {detail?.reason ?? selected.reason ?? "—"} · Statut : {detail?.status ?? selected.status ?? "—"}</div></div><h3 style={{ margin: "20px 0 10px" }}>Preuves / photos</h3>{evidence.length ? <div style={{ display: "grid", gap: 8 }}>{evidence.map((x) => <div key={x.id} style={{ padding: 12, border: "1px solid rgba(148,163,184,.12)", borderRadius: 11 }}><b>{x.media_type ?? "Fichier"}</b><div style={{ color: "#8fa6bf", fontSize: 12 }}>{x.caption ?? "Sans commentaire"} · {new Date(x.created_at).toLocaleString("fr-FR")}</div>{x.file_url && <a href={x.file_url} target="_blank" rel="noreferrer" style={{ color: "#65b5ff", fontSize: 12 }}>Ouvrir la preuve</a>}</div>)}</div> : <p style={{ color: "#8fa6bf" }}>Aucune preuve enregistrée.</p>}<h3 style={{ margin: "20px 0 10px" }}>Historique</h3>{events.length ? events.map((x) => <div key={x.id} style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)", fontSize: 12 }}><b>{x.event_type}</b> · {new Date(x.created_at).toLocaleString("fr-FR")}<div style={{ color: "#8fa6bf" }}>{x.details ? JSON.stringify(x.details) : ""}</div></div>) : <p style={{ color: "#8fa6bf" }}>Aucun événement.</p>}<div style={{ marginTop: 22, borderTop: "1px solid rgba(148,163,184,.14)", paddingTop: 18 }}><h3>Décision administrative</h3><select value={resolution} onChange={(e) => setResolution(e.target.value)} style={css.input}><option value="refund_buyer">Rembourser l'acheteur</option><option value="release_seller">Libérer les fonds au vendeur</option></select><textarea value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} placeholder="Explication de la décision" style={{ ...css.input, minHeight: 90, marginTop: 10 }} /><button style={{ ...css.primary, marginTop: 10 }} disabled={busy} onClick={resolveDispute}>{busy ? "Traitement…" : "Enregistrer la décision"}</button>{notice && <p style={{ color: notice.includes("traité") ? "#7fe0ac" : "#ff9c9c" }}>{notice}</p>}</div></div></div>}

    {active === "support" && selected && <div style={css.modal} onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><div style={css.panel}><header style={{ display: "flex", justifyContent: "space-between" }}><div><small style={{ color: "#59a9ff", fontWeight: 900 }}>SUPPORT CLIENT</small><h2 style={{ margin: "6px 0" }}>{selected.name ?? "Client"} · {selected.phone ?? "—"}</h2></div><button style={css.secondary} onClick={() => setSelected(null)}>Fermer</button></header><div style={{ marginTop: 18, padding: 16, background: "#071525", borderRadius: 14, whiteSpace: "pre-wrap" }}><b>Message initial</b><p style={{ marginBottom: 0 }}>{selected.message ?? "—"}</p></div><h3 style={{ margin: "20px 0 10px" }}>Historique des échanges</h3><div style={{ maxHeight: 260, overflow: "auto", padding: "4px 2px" }}>{supportMessages.length ? supportMessages.map((m) => <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(148,163,184,.1)" }}><b>{m.sender_type === "admin" ? "Administrateur" : "Client"}</b><span style={{ float: "right", color: "#8fa6bf", fontSize: 12 }}>{m.created_at ? new Date(m.created_at).toLocaleString("fr-FR") : "—"}</span><p style={{ whiteSpace: "pre-wrap", color: "#c6d4e3", margin: "6px 0 0" }}>{m.message}</p></div>) : <p style={{ color: "#8fa6bf" }}>Aucun échange supplémentaire.</p>}</div><div style={{ marginTop: 18 }}><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Répondre au client…" style={{ ...css.input, minHeight: 120 }} /><button style={{ ...css.primary, marginTop: 10 }} disabled={busy || !draft.trim()} onClick={sendSupport}>{busy ? "Envoi…" : "Envoyer la réponse"}</button>{notice && <p style={{ color: notice.includes("envoyée") ? "#7fe0ac" : "#ff9c9c" }}>{notice}</p>}</div></div></div>}
  </>;
}
