"use client";

import { useEffect } from "react";

/** Registers SW; drops old caches that used to serve a stale login page. */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.startsWith("cyenoo-pwa") || k === "cyenoo-pwa-v2")
              .map((k) => caches.delete(k))
          );
        }
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await reg.update().catch(() => {});
      } catch (e) {
        console.warn("[Cyenoo PWA] SW register failed", e);
      }
    };

    const t = window.setTimeout(register, 400);
    return () => window.clearTimeout(t);
  }, []);

  return null;
}
