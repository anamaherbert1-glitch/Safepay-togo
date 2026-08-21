"use client";

import { useRouter } from "next/navigation";

const services = [
  ["Mobile Money", "Recharge et paiements", "orange", "/wallet"],
  ["Paiements", "Gérer vos paiements", "violet", "/transactions"],
  ["Transferts", "Envoyer ou recevoir", "green", "/transactions"],
  ["Transactions", "Voir l'historique", "blue", "/transactions"],
];

export default function ServicesPage() {
  const router = useRouter();
  return <main className="safepay-shell safepay-dashboard">
    <header className="sp-header"><button className="sp-back" onClick={() => router.back()} aria-label="Retour">←</button><strong>Services</strong><span style={{ width: 36 }} /></header>
    <section className="sp-content"><p className="sp-eyebrow">SafePay</p><h1 className="sp-title">Tous vos services</h1>
      <section className="sp-services-page">{services.map(([title, description, color, href]) => <button key={title} className="sp-service-card" onClick={() => router.push(href)}><span className={`service-icon ${color}`}>•</span><span><strong>{title}</strong><small>{description}</small></span><b>›</b></button>)}</section>
    </section>
  </main>;
}
