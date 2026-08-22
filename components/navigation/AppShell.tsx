"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function HomeIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6"/></svg>; }
function TransactionsIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h11"/><path d="m14 4 3 3-3 3"/><path d="M18 17H7"/><path d="m10 14-3 3 3 3"/></svg>; }
function NotificationsIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9" r="2.7"/><path d="M7.2 18c.9-2.6 2.5-3.9 4.8-3.9s3.9 1.3 4.8 3.9"/></svg>; }

const items = [
  { href: "/dashboard", label: "Accueil", icon: <HomeIcon /> },
  { href: "/transactions", label: "Transactions", icon: <TransactionsIcon /> },
  { href: "/notifications", label: "Notifications", icon: <NotificationsIcon /> },
  { href: "/profile", label: "Profil", icon: <ProfileIcon /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { router.replace("/login"); return; }
      if (!user.email_confirmed_at || !user.phone_confirmed_at) { router.replace("/auth?resume=1"); return; }

      const { data: profile } = await supabase.rpc("get_my_profile");
      if (!active) return;
      if (!profile || !profile.full_name || !profile.phone_verified) { router.replace("/auth?resume=1"); return; }

      setAvatarUrl(profile.avatar_url || "");
      setChecking(false);
    };

    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    const onAvatarUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ url?: string }>;
      if (custom.detail?.url) setAvatarUrl(custom.detail.url);
    };
    window.addEventListener("safepay-avatar-updated", onAvatarUpdated);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("safepay-avatar-updated", onAvatarUpdated);
    };
  }, [router]);

  function goBack() {
    if (pathname === "/dashboard") return;
    if (window.history.length > 1) router.back();
    else router.replace("/dashboard");
  }

  if (checking) return <div className="safepay-shell safepay-dashboard"><div className="sp-page-loading" role="status"><span className="sp-loader"/>Chargement de SafePay…</div></div>;

  return <div className="safepay-shell safepay-dashboard">
    <header className="sp-header">
      {pathname !== "/dashboard" ? <button className="sp-back" onClick={goBack} aria-label="Retour">←</button> : <span className="sp-header-spacer" aria-hidden="true"/>}
      <button className="sp-brand" onClick={() => router.replace("/dashboard")} aria-label="Accueil SafePay">SafePay</button>
      <span className="sp-header-spacer" aria-hidden="true"/>
    </header>

    <main className="sp-content">{children}</main>

    <nav className="sp-bottom-nav" aria-label="Navigation principale">
      {items.map(item => {
        const isProfile = item.href === "/profile";
        return <button key={item.href} className={pathname === item.href ? "active" : ""} onClick={() => router.push(item.href)} aria-current={pathname === item.href ? "page" : undefined}>
          <span className={isProfile ? "sp-nav-profile-icon" : ""} aria-hidden="true">{isProfile && avatarUrl ? <img src={avatarUrl} alt=""/> : item.icon}</span>
          <small>{item.label}</small>
        </button>;
      })}
    </nav>
  </div>;
}
