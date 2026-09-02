"use client";

import { useEffect, useState } from "react";
import FinanceCommission from "./FinanceCommission";

export default function FinanceNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const inject = () => {
      const navs = document.querySelectorAll<HTMLElement>(".adm-sidebar nav");
      const nav = navs[0];
      if (!nav || nav.querySelector("[data-safepay-finance]") ) return;

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-safepay-finance", "true");
      button.className = "adm-finance-nav";
      button.innerHTML = '<span aria-hidden="true">₣</span><span><b>Finance &amp; Commissions</b><small>Commissions &amp; frais</small></span>';
      button.addEventListener("click", () => setOpen(true));
      nav.prepend(button);
    };

    inject();
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Finance & Commissions"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0,0,0,.55)",
      }}
    >
      <div style={{ position: "relative", width: "min(920px, 100%)", maxHeight: "90vh", overflow: "auto", borderRadius: 18 }}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer Finance & Commissions"
          style={{ position: "absolute", top: 12, right: 12, zIndex: 2, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(0,0,0,.35)", color: "inherit", cursor: "pointer" }}
        >
          ×
        </button>
        <FinanceCommission />
      </div>
    </div>
  );
}
