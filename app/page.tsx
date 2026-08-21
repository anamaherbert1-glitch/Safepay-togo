import Link from "next/link";

function ProfileIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9"/></svg>; }

export default function Home() {
  return <main className="safepay-shell" style={{ minHeight: "100vh", padding: 20 }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}><strong style={{ fontSize: 21 }}>SafePay</strong><button className="safepay-icon" aria-label="Profil" title="Profil"><ProfileIcon /></button></header>
    <section style={{ paddingTop: 48 }}><div className="safepay-card" style={{ padding: 22 }}>
      <div style={{ color: "var(--sp-muted)", fontSize: 13 }}>SafePay V5</div>
      <h1 style={{ margin: "8px 0", fontSize: 30 }}>Bienvenue sur SafePay</h1>
      <p style={{ color: "var(--sp-muted)", lineHeight: 1.5 }}>Paiements sécurisés, portefeuille et transactions d’escrow dans une interface simple.</p>
      <Link href="/auth" className="safepay-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 18 }}>Créer un compte</Link>
      <Link href="/login" className="sp-secondary-button" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 10 }}>Se connecter</Link>
    </div></section>
  </main>;
}
