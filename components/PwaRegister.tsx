"use client";

import { useEffect } from "react";

/** Registers the service worker so Chrome/Android show "Install app". */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Force update check so install criteria stay fresh
        reg.update().catch(() => {});
      } catch (e) {
        console.warn("[Cyenoo PWA] SW register failed", e);
      }
    };

    // Delay slightly so first paint is not blocked
    const t = window.setTimeout(register, 800);
    return () => window.clearTimeout(t);
  }, []);

  return null;
}
