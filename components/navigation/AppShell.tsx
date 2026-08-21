"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";

const items = [
  { href: "/", label: "Accueil", icon: "⌂" },
  { href: "/transactions", label: "Transactions", icon: "↔" },
  { href: "/notifications", label: "Notifications", icon: "♢" },
  { href: "/profile", label: "Profil", icon: "👤" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setModalOpen(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function openModal() {
    setModalOpen(true);
    window.history.pushState({ modal: true }, "");
  }

  function closeModal() {
    if (modalOpen) window.history.back();
    setModalOpen(false);
  }

  return (
    <div className="safepay-shell">
      <header className="sp-header">
        <button className="sp-brand" onClick={() => router.push("/")} aria-label="Accueil SafePay">
          SafePay
        </button>
        <IconButton label="Profil" onClick={() => router.push("/profile")}>
          <span aria-hidden="true">👤</span>
        </IconButton>
      </header>

      <main className="sp-content">{children}</main>

      <nav className="sp-nav" aria-label="Navigation principale">
        {items.map((item) => (
          <button
            key={item.href}
            className={`sp-nav-item${pathname === item.href ? " active" : ""}`}
            onClick={() => router.push(item.href)}
          >
            <span className="sp-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {modalOpen && (
        <div className="sp-overlay" role="dialog" aria-modal="true" aria-label="Fenêtre SafePay">
          <section className="sp-modal">
            <button className="sp-back" onClick={closeModal} aria-label="Retour">
              ← Retour
            </button>
            <h2>Fenêtre SafePay</h2>
            <p>Le bouton Retour ferme cette fenêtre sans renvoyer l'utilisateur à l'accueil.</p>
          </section>
        </div>
      )}

      <button className="sp-demo-modal" onClick={openModal}>Tester une fenêtre</button>
    </div>
  );
}
