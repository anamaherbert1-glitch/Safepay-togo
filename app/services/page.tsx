"use client";

import { useRouter } from "next/navigation";

function WalletIcon() { return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 7.5h14a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3h10" strokeLinecap="round"/><path d="M17 13h3.5v3H17a1.5 1.5 0 1 1 0-3Z"/></svg>; }
function CardIcon() { return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>; }
function TransferIcon() { return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h11"/><path d="m14 4 3 3-3 3"/><path d="M18 17H7"/><path d="m10 14-3 3 3 3"/></svg>; }
function HistoryIcon() { return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 5v4h4"/><path d="M12 8v4l3 2"/></svg>; }
function SettingsIcon() { return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="3"/><path d="m5.6 5.6 2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>; }

const services = [
  ["Recharger", "T-Money, Moov Money ou carte", "orange", "/wallet/deposit", <WalletIcon />],
  ["Retirer", "T-Money ou Moov Money", "violet", "/wallet/withdraw", <CardIcon />],
  ["Transferts", "Créer une transaction sécurisée", "green", "/transactions/new", <TransferIcon />],
  ["Transactions", "Voir l'historique", "blue", "/transactions", <HistoryIcon />],
  ["Paramètres", "Thème, langue, devise et sécurité", "blue", "/settings", <SettingsIcon />],
] as const;

export default function ServicesPage() {
  const router = useRouter();
  return <main className="safepay-shell safepay-dashboard">
    <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour"><span className="sp-back-icon" aria-hidden="true"/></button><strong>Services</strong><span style={{ width: 40 }} /></header>
    <section className="sp-content"><p className="sp-eyebrow">Services</p><h1 className="sp-title">Tous vos services</h1>
      <section className="sp-services-page">{services.map(([title, description, color, href, icon]) => <button key={title} className="sp-service-card" onClick={() => router.push(href)}><span className={`service-icon ${color}`}>{icon}</span><span><strong>{title}</strong><small>{description}</small></span><b>›</b></button>)}</section>
    </section>
  </main>;
}
