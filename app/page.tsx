"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Phase = "intro" | "ready";

/** Cyenoo mark: C + growth bars (matches brand logo) */
function CyenooMark({ size = 72, variant = "blue" }: { size?: number; variant?: "blue" | "white" }) {
  const stroke = variant === "white" ? "#ffffff" : "#155eef";
  const bar = variant === "white" ? "#ffffff" : "#155eef";
  const orbit = variant === "white" ? "rgba(255,255,255,.4)" : "rgba(21,94,239,.28)";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <ellipse cx="60" cy="68" rx="46" ry="16" fill="none" stroke={orbit} strokeWidth="3.5" transform="rotate(-26 60 68)" />
      <path
        d="M82 26c-20-12-48-8-60 12-13 20-9 46 12 58 18 11 42 9 56-4"
        fill="none"
        stroke={stroke}
        strokeWidth="15"
        strokeLinecap="round"
      />
      <rect x="46" y="58" width="10" height="20" rx="2.5" fill={bar} />
      <rect x="59" y="48" width="10" height="30" rx="2.5" fill={bar} />
      <rect x="72" y="38" width="10" height="40" rx="2.5" fill={bar} />
      <rect x="85" y="28" width="10" height="50" rx="2.5" fill={bar} />
    </svg>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    // Always show splash on every app open (except reduced-motion)
    if (media.matches) {
      setPhase("ready");
      return;
    }
    const t = window.setTimeout(() => setPhase("ready"), 5000);
    return () => window.clearTimeout(t);
  }, []);

  function skip() {
    setPhase("ready");
  }

  if (phase === "intro") {
    return (
      <main className="cy-splash" onClick={skip} role="presentation">
        <div className={`cy-splash-stage ${reduceMotion ? "static" : ""}`}>
          <div className="cy-logo-3d" aria-hidden="true">
            <div className="cy-logo-plate">
              <CyenooMark size={110} variant="white" />
            </div>
          </div>
          <strong className="cy-splash-wordmark">Cyenoo</strong>
          <p className="cy-splash-hint">Touchez pour continuer</p>
        </div>
        <style>{`
          .cy-splash {
            min-height: 100vh;
            width: 100%;
            margin: 0;
            display: grid;
            place-items: center;
            background: linear-gradient(160deg, #0b3fa8 0%, #155eef 48%, #0a2f7a 100%);
            color: #fff;
            overflow: hidden;
            cursor: pointer;
            font-family: Inter, system-ui, sans-serif;
          }
          .cy-splash-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 22px;
            animation: cy-enter 5s cubic-bezier(.22,1,.36,1) forwards;
          }
          .cy-splash-stage.static { animation: none; opacity: 1; transform: none; }
          .cy-logo-3d {
            width: 160px;
            height: 160px;
            display: grid;
            place-items: center;
            animation: cy-spin-zoom 4.6s cubic-bezier(.22,1,.36,1) forwards;
            filter: drop-shadow(0 22px 48px rgba(0,0,0,.35));
          }
          .cy-logo-plate {
            width: 140px;
            height: 140px;
            border-radius: 36px;
            display: grid;
            place-items: center;
            background: linear-gradient(145deg, rgba(255,255,255,.18), rgba(255,255,255,.06));
            border: 1px solid rgba(255,255,255,.22);
            backdrop-filter: blur(6px);
          }
          .cy-splash-wordmark {
            font-size: 38px;
            font-weight: 800;
            letter-spacing: -0.6px;
            color: #ffffff;
            text-shadow: 0 2px 0 rgba(0,0,0,.12), 0 12px 30px rgba(0,0,0,.3);
            animation: cy-fade-up 1.6s ease 0.7s both;
          }
          .cy-splash-hint {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,.92);
            animation: cy-fade-up 1.2s ease 1.8s both;
          }
          @keyframes cy-spin-zoom {
            0% { opacity: 0; transform: scale(0.22) rotate(-220deg); }
            30% { opacity: 1; transform: scale(1.1) rotate(14deg); }
            50% { transform: scale(0.95) rotate(-5deg); }
            70% { transform: scale(1.03) rotate(2deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes cy-enter {
            0% { opacity: 0; }
            10% { opacity: 1; }
            82% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.22); }
          }
          @keyframes cy-fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .cy-logo-3d, .cy-splash-stage, .cy-splash-wordmark, .cy-splash-hint {
              animation: none !important; opacity: 1; transform: none;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="safepay-shell onboarding-screen cy-entry">
      <header className="onboarding-header">
        <div className="onboarding-logo">
          <span className="cy-brand-badge" aria-hidden="true">
            <CyenooMark size={28} variant="white" />
          </span>
          <strong>Cyenoo</strong>
        </div>
      </header>
      <section className="onboarding-content" style={{ justifyContent: "center", gap: 24 }}>
        <div className="cy-entry-hero" aria-hidden="true">
          <div className="cy-entry-mark">
            <CyenooMark size={78} variant="blue" />
          </div>
        </div>
        <div className="onboarding-copy cy-entry-copy">
          <div className="auth-kicker">CYENOO</div>
          <h1>Votre argent, en toute simplicité.</h1>
          <p>Envoyez, recevez et payez à distance avec une protection pensée pour vous.</p>
        </div>
        <div className="onboarding-actions">
          <Link href="/auth" className="safepay-primary onboarding-primary">Créer un compte</Link>
          <Link href="/login" className="onboarding-secondary">J'ai déjà un compte</Link>
        </div>
      </section>
      <style>{`
        .cy-entry .onboarding-logo strong {
          color: #0f294d !important;
          opacity: 1 !important;
          font-weight: 850;
        }
        .cy-brand-badge {
          display: grid !important;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2f7cff, #155eef);
          box-shadow: 0 8px 20px rgba(21,94,239,.28);
          overflow: hidden;
        }
        .cy-entry-hero { display: grid; place-items: center; margin-top: 8px; }
        .cy-entry-mark {
          width: 104px;
          height: 104px;
          border-radius: 30px;
          background: #ffffff;
          display: grid;
          place-items: center;
          box-shadow: 0 14px 36px rgba(21,94,239,.18), 0 2px 8px rgba(16,24,40,.06);
          border: 1px solid rgba(21,94,239,.12);
        }
        .cy-entry-copy .auth-kicker {
          color: #155eef !important;
          font-weight: 800 !important;
          letter-spacing: .12em;
          opacity: 1 !important;
        }
        .cy-entry-copy h1 {
          color: #101828 !important;
          opacity: 1 !important;
          -webkit-text-fill-color: #101828 !important;
        }
        .cy-entry-copy p {
          color: #344054 !important;
          opacity: 1 !important;
          font-weight: 500;
          line-height: 1.55;
        }
        .cy-entry .onboarding-secondary {
          color: #155eef !important;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}
