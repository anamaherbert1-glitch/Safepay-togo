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
    const t = window.setTimeout(() => {
      setPhase("ready");
      window.localStorage.setItem("cyenoo-splash-seen", "1");
    }, 2800);
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
            <div className="cy-logo-orbit" />
            <div className="cy-logo-mark">
              <span className="cy-logo-c">C</span>
              <span className="cy-logo-bars">
                <i /><i /><i /><i />
              </span>
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
            background: linear-gradient(160deg, #0b3fa8 0%, #155eef 45%, #0a2f7a 100%);
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
            animation: cy-enter 2.6s cubic-bezier(.22,1,.36,1) forwards;
          }
          .cy-splash-stage.static { animation: none; opacity: 1; transform: none; }
          .cy-logo-3d {
            position: relative;
            width: 140px;
            height: 140px;
            display: grid;
            place-items: center;
            animation: cy-spin-zoom 2.4s cubic-bezier(.22,1,.36,1) forwards;
            filter: drop-shadow(0 18px 40px rgba(0,0,0,.28));
          }
          .cy-logo-orbit {
            position: absolute;
            inset: 8px;
            border: 3px solid rgba(255,255,255,.35);
            border-radius: 50%;
            border-top-color: transparent;
            border-left-color: transparent;
            transform: rotate(-25deg);
          }
          .cy-logo-mark {
            position: relative;
            width: 92px;
            height: 92px;
            border-radius: 28px;
            background: linear-gradient(145deg, #ffffff 0%, #e8f0ff 100%);
            color: #155eef;
            display: grid;
            place-items: center;
            box-shadow: inset 0 2px 0 rgba(255,255,255,.9), 0 10px 28px rgba(11,63,168,.35);
          }
          .cy-logo-c {
            font-size: 54px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -2px;
            margin-left: -6px;
          }
          .cy-logo-bars {
            position: absolute;
            right: 14px;
            bottom: 18px;
            display: flex;
            align-items: flex-end;
            gap: 4px;
            height: 28px;
          }
          .cy-logo-bars i {
            display: block;
            width: 7px;
            border-radius: 2px;
            background: #155eef;
          }
          .cy-logo-bars i:nth-child(1) { height: 10px; }
          .cy-logo-bars i:nth-child(2) { height: 16px; }
          .cy-logo-bars i:nth-child(3) { height: 22px; }
          .cy-logo-bars i:nth-child(4) { height: 28px; }
          .cy-splash-wordmark {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: -0.6px;
            text-shadow: 0 8px 24px rgba(0,0,0,.25);
            animation: cy-fade-up 1.2s ease 0.35s both;
          }
          .cy-splash-hint {
            margin: 0;
            font-size: 13px;
            opacity: 0.72;
            animation: cy-fade-up 1s ease 1.1s both;
          }
          @keyframes cy-spin-zoom {
            0% { opacity: 0; transform: scale(0.35) rotate(-160deg); }
            45% { opacity: 1; transform: scale(1.08) rotate(12deg); }
            70% { transform: scale(0.96) rotate(-4deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes cy-enter {
            0% { opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @keyframes cy-fade-up {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .cy-logo-3d, .cy-splash-stage, .cy-splash-wordmark, .cy-splash-hint { animation: none !important; opacity: 1; transform: none; }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="safepay-shell onboarding-screen cy-entry">
      <header className="onboarding-header">
        <div className="onboarding-logo">
          <span>CY</span>
          <strong>Cyenoo</strong>
        </div>
      </header>
      <section className="onboarding-content" style={{ justifyContent: "center", gap: 28 }}>
        <div className="cy-entry-hero" aria-hidden="true">
          <div className="cy-logo-mark cy-entry-mark">
            <span className="cy-logo-c">C</span>
            <span className="cy-logo-bars"><i /><i /><i /><i /></span>
          </div>
        </div>
        <div className="onboarding-copy">
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
        .cy-entry .cy-entry-hero { display: grid; place-items: center; margin-top: 12px; }
        .cy-entry-mark {
          width: 88px; height: 88px; border-radius: 26px;
          background: linear-gradient(145deg, #ffffff 0%, #e8f0ff 100%);
          color: #155eef; display: grid; place-items: center; position: relative;
          box-shadow: 0 12px 28px rgba(21,94,239,.22);
        }
        .cy-entry-mark .cy-logo-c { font-size: 48px; font-weight: 900; line-height: 1; margin-left: -4px; }
        .cy-entry-mark .cy-logo-bars {
          position: absolute; right: 12px; bottom: 16px;
          display: flex; align-items: flex-end; gap: 3px; height: 24px;
        }
        .cy-entry-mark .cy-logo-bars i {
          display: block; width: 6px; border-radius: 2px; background: #155eef;
        }
        .cy-entry-mark .cy-logo-bars i:nth-child(1) { height: 8px; }
        .cy-entry-mark .cy-logo-bars i:nth-child(2) { height: 14px; }
        .cy-entry-mark .cy-logo-bars i:nth-child(3) { height: 18px; }
        .cy-entry-mark .cy-logo-bars i:nth-child(4) { height: 24px; }
      `}</style>
    </main>
  );
}
