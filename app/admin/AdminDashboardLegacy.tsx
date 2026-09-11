"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Temporary stub — full AdminDashboardLegacy is being restored with Cyenoo branding. */
export default function AdminDashboardLegacy() {
  const router = useRouter();
  useEffect(() => {
    // Keep admin route usable
  }, []);
  return (
    <main style={{ minHeight: "100vh", background: "#050b14", color: "#eef6ff", fontFamily: "Inter, system-ui, sans-serif", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#1984ff,#1261df)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontWeight: 900, fontSize: 20 }}>CY</div>
        <h1 style={{ margin: "0 0 8px" }}>Cyenoo Admin</h1>
        <p style={{ color: "#91a8bc", margin: "0 0 20px" }}>
          Le tableau de bord admin complet est en cours de restauration avec le branding Cyenoo.
          Utilisez les pages modules en attendant.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/admin/users" style={{ padding: "10px 14px", borderRadius: 10, background: "#1677ff", color: "#fff", textDecoration: "none", fontWeight: 700 }}>Utilisateurs</a>
          <a href="/admin/finance" style={{ padding: "10px 14px", borderRadius: 10, background: "#12365a", color: "#dbeeff", textDecoration: "none", fontWeight: 700 }}>Finance</a>
          <a href="/dashboard" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,.25)", color: "#c6d4e3", textDecoration: "none" }}>Retour Cyenoo</a>
        </div>
      </div>
    </main>
  );
}
