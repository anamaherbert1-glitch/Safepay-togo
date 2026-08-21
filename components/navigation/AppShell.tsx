"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";

function HomeIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6"/></svg>; }
function TransactionsIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h11"/><path d="m14 4 3 3-3 3"/><path d="M18 17H7"/><path d="m10 14-3 3 3 3"/></svg>; }
function NotificationsIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9"/></svg>; }

const items = [
  { href: "/", label: "Accueil", icon: <HomeIcon /> },
  { href: "/transactions", label: "Transactions", icon: <TransactionsIcon /> },
  { href: "/notifications", label: "Notifications", icon: <NotificationsIcon /> },
  { href: "/profile", label: "Profil", icon: <ProfileIcon /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="safepay-shell safepay-dashboard">
      <header className="sp-header">
        <button className="sp-brand" onClick={() => router.push("/")} aria-label="Accueil SafePay">SafePay</button>
        <IconButton label="Profil" onClick={() => router.push("/profile")}><ProfileIcon /></IconButton>
      </header>
      <main className="sp-content">{children}</main>
      <nav className="sp-bottom-nav" aria-label="Navigation principale">
        {items.map((item) => (
          <button key={item.href} className={pathname === item.href ? "active" : ""} onClick={() => router.push(item.href)}>
            <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
