import Link from "next/link";

export default function Home() {
  return <main className="safepay-shell auth-screen">
    <header className="auth-header"><strong>SafePay</strong></header>
    <section className="auth-content"><div className="safepay-card auth-card">
      <div className="auth-kicker">SafePay V5</div>
      <h1>Bienvenue sur SafePay</h1>
      <p className="sp-muted" style={{lineHeight:1.5}}>Paiements sécurisés, portefeuille et transactions d’escrow dans une interface simple.</p>
      <Link href="/auth" className="safepay-primary" style={{display:"block",textAlign:"center",textDecoration:"none",marginTop:18}}>Créer un compte</Link>
      <Link href="/login" className="sp-secondary-button" style={{display:"block",textAlign:"center",textDecoration:"none",marginTop:10}}>Se connecter</Link>
    </div></section>
  </main>;
}
