"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Phase = "intro" | "ready";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const seen = window.localStorage.getItem("cyenoo-splash-seen") === "1";
    if (seen || media.matches) {
      setPhase("ready");
      return;
    }
    // ~4.5s: slower entrance so the logo is readable
    const t = window.setTimeout(() => {
      setPhase("ready");
      window.localStorage.setItem("cyenoo-splash-seen", "1");
    }, 4500);
    return () => window.clearTimeout(t);
  }, []);

  function skip() {
    setPhase("ready");
    window.localStorage.setItem("cyenoo-splash-seen", "1");
  }

  if (phase === "intro") {
    return (
      <main className="cy-splash" onClick={skip} role="presentation">
        <div className={`cy-splash-stage ${reduceMotion ? "static" : ""}`}>
          <div className="cy-logo-3d" aria-hidden="true">
            <svg className="cy-logo-svg" viewBox="0 0 120 120" width="132" height="132">
              <defs>
                <linearGradient id="cyFace" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e8f1ff" />
                </linearGradient>
              </defs>
              <ellipse cx="60" cy="62" rx="48" ry="18" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="4" transform="rotate(-28 60 62)" />
              <path
                d="M78 28c-18-10-42-6-54 12-12 18-8 42 10 54 16 11 38 10 52-2"
                fill="none"
                stroke="url(#cyFace)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M78 28c-18-10-42-6-54 12-12 18-8 42 10 54 16 11 38 10 52-2"
                fill="none"
                stroke="#d6e6ff"
                strokeWidth="10"
                strokeLinecap="round"
                opacity=".9"
              />
              <rect x="48" y="58" width="9" height="18" rx="2" fill="#ffffff" />
              <rect x="60" y="48" width="9" height="28" rx="2" fill="#ffffff" />
              <rect x="72" y="38" width="9" height="38" rx="2" fill="#ffffff" />
              <rect x="84" y="30" width="9" height="46" rx="2" fill="#ffffff" />
            </svg>
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
            gap: 20px;
            animation: cy-enter 4.4s cubic-bezier(.22,1,.36,1) forwards;
          }
          .cy-splash-stage.static { animation: none; opacity: 1; transform: none; }
          .cy-logo-3d {
            width: 140px;
            height: 140px;
            display: grid;
            place-items: center;
            animation: cy-spin-zoom 3.6s cubic-bezier(.22,1,.36,1) forwards;
            filter: drop-shadow(0 20px 42px rgba(0,0,0,.32));
          }
          .cy-logo-svg { display: block; }
          .cy-splash-wordmark {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -0.6px;
            color: #ffffff;
            text-shadow: 0 2px 0 rgba(0,0,0,.12), 0 10px 28px rgba(0,0,0,.28);
            animation: cy-fade-up 1.4s ease 0.55s both;
          }
          .cy-splash-hint {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,.92);
            animation: cy-fade-up 1.1s ease 1.5s both;
          }
          @keyframes cy-spin-zoom {
            0% { opacity: 0; transform: scale(0.28) rotate(-200deg); }
            35% { opacity: 1; transform: scale(1.12) rotate(18deg); }
            55% { transform: scale(0.94) rotate(-6deg); }
            75% { transform: scale(1.04) rotate(3deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes cy-enter {
            0% { opacity: 0; }
            12% { opacity: 1; }
            78% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.28); }
          }
          @keyframes cy-fade-up {
            from { opacity: 0; transform: translateY(14px); }
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
          <span className="cy-brand-badge">CY</span>
          <strong>Cyenoo</strong>
        </div>
      </header>
      <section className="onboarding-content" style={{ justifyContent: "center", gap: 24 }}>
        <div className="cy-entry-hero" aria-hidden="true">
          <div className="cy-entry-mark">
            <svg viewBox="0 0 120 120" width="72" height="72">
              <path d="M78 28c-18-10-42-6-54 12-12 18-8 42 10 54 16 11 38 10 52-2" fill="none" stroke="#155eef" strokeWidth="14" strokeLinecap="round" />
              <rect x="48" y="58" width="9" height="18" rx="2" fill="#155eef" />
              <rect x="60" y="48" width="9" height="28" rx="2" fill="#155eef" />
              <rect x="72" y="38" width="9" height="38" rx="2" fill="#155eef" />
              <rect x="84" y="30" width="9" height="46" rx="2" fill="#155eef" />
            </svg>
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
        /* High-contrast entry UI */
        .cy-entry .onboarding-logo strong {
          color: #0f294d !important;
          opacity: 1 !important;
          font-weight: 850;
        }
        .cy-brand-badge {
          display: grid !important;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2f7cff, #155eef);
          color: #fff !important;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: -0.3px;
        }
        .cy-entry-hero { display: grid; place-items: center; margin-top: 8px; }
        .cy-entry-mark {
          width: 96px;
          height: 96px;
          border-radius: 28px;
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
