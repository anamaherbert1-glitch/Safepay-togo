"use client";

import { useEffect, useState } from "react";
import { getLanguage, setLanguage, type SafePayLanguage } from "@/lib/preferences";

export const copy = {
  fr: {
    continue: "Continuer",
    createAccount: "Créer un compte",
    login: "J'ai déjà un compte",
    welcome: "Votre argent, en toute simplicité.",
    secure: "Envoyez, recevez et payez à distance avec une protection pensée pour vous.",
    transfer: "Transfert sécurisé",
    transferText: "Deux personnes, un paiement, une confirmation. SafePay garde le suivi de chaque étape.",
    pay: "Payez simplement",
    payText: "Mobile Money, paiements et transactions d'escrow dans une seule application.",
    secureTitle: "Votre argent reste sous contrôle",
    secureText: "Wallet réel, suivi des transactions et protection des opérations côté serveur.",
    phone: "Numéro de téléphone",
    otp: "Vérifier votre téléphone",
    profile: "Votre profil",
    appLanguage: "Langue de l'application",
    french: "Français",
    english: "English",
  },
  en: {
    continue: "Continue",
    createAccount: "Create account",
    login: "I already have an account",
    welcome: "Your money, made simple.",
    secure: "Send, receive and pay remotely with protection designed for you.",
    transfer: "Secure transfer",
    transferText: "Two people, one payment, one confirmation. SafePay keeps track of every step.",
    pay: "Pay simply",
    payText: "Mobile Money, payments and escrow transactions in one application.",
    secureTitle: "Keep your money under control",
    secureText: "Real wallet, transaction tracking and server-side protection for your operations.",
    phone: "Phone number",
    otp: "Verify your phone",
    profile: "Your profile",
    appLanguage: "Application language",
    french: "Français",
    english: "English",
  },
} as const;

export function useSafePayLanguage() {
  const [language, setLanguageState] = useState<SafePayLanguage>("fr");
  useEffect(() => {
    const sync = () => setLanguageState(getLanguage());
    sync();
    window.addEventListener("safepay-language-updated", sync);
    return () => window.removeEventListener("safepay-language-updated", sync);
  }, []);
  return { language, t: copy[language], changeLanguage: (next: SafePayLanguage) => { setLanguage(next); setLanguageState(next); } };
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, changeLanguage } = useSafePayLanguage();
  return (
    <div className={compact ? "sp-language-switcher compact" : "sp-language-switcher"} aria-label="Language">
      <button className={language === "fr" ? "active" : ""} onClick={() => changeLanguage("fr")} aria-pressed={language === "fr"}>🇫🇷 FR</button>
      <button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")} aria-pressed={language === "en"}>🇬🇧 EN</button>
    </div>
  );
}
