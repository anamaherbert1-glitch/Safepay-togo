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

function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return Promise.race([Promise.resolve(promise), new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Chargement trop long.")), ms))]);
}

function fallbackPath(pathname: string) {
  if (pathname.startsWith("/transactions/")) return "/transactions";
  if (pathname.startsWith("/wallet/")) return "/wallet";
  if (pathname.startsWith("/services/")) return "/services";
  if (pathname.startsWith("/support/")) return "/support";
  return "/dashboard";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      setChecking(true); setAuthorized(false);
      try {
        const { data: { user }, error: userError } = await withTimeout(supabase.auth.getUser());
        if (!active) return;
        if (userError || !user) { router.replace("/login"); return; }
        // SafePay now uses phone-only authentication. Email confirmation is not
        // required for access to the app because email signup was removed.
        if (!user.phone_confirmed_at) { router.replace("/auth?resume=1"); return; }
        const { data: profile } = await withTimeout(supabase.rpc("get_my_profile"));
        if (!active) return;
        if (!profile || !profile.full_name || !profile.phone_verified) { router.replace("/auth?resume=1"); return; }
        setAvatarUrl(profile.avatar_url || "");
        setAuthorized(true);
      } catch {
        if (active) router.replace("/login");
      } finally {
        if (active) setChecking(false);
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthorized(false); router.replace("/login"); }
    });
    const onAvatarUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ url?: string }>;
      setAvatarUrl(custom.detail?.url || "");
    };
    window.addEventListener("safepay-avatar-updated", onAvatarUpdated);
    return () => {
      active = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("safepay-avatar-updated", onAvatarUpdated);
    };
  }, [router]);

  function goBack() {
    if (navigating) return;
    if (pathname === "/dashboard") return;
    setNavigating(true);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      window.setTimeout(() => setNavigating(false), 500);
      return;
    }
    router.replace(fallbackPath(pathname));
    window.setTimeout(() => setNavigating(false), 500);
  }

  function navigate(href: string) {
    if (href === pathname || navigating) return;
    setNavigating(true);
    router.replace(href);
    window.setTimeout(() => setNavigating(false), 500);
  }

  if (checking || !authorized) return <div className="safepay-shell safepay-dashboard"><div className="sp-page-loading" role="status"><span className="sp-loader"/>Chargement de SafePay…</div></div>;

  return <div className="safepay-shell safepay-dashboard">
    <header className="sp-header">
      {pathname !== "/dashboard" ? <button className="sp-back" onClick={goBack} disabled={navigating} aria-label="Retour">←</button> : <span className="sp-header-spacer" aria-hidden="true"/>}
      <button className="sp-brand" onClick={() => navigate("/dashboard")} aria-label="Accueil SafePay">SafePay</button>
      <span className="sp-header-spacer" aria-hidden="true"/>
    </header>
    <main className="sp-content">{children}</main>
    <nav className="sp-bottom-nav" aria-label="Navigation principale">
      {items.map(item => {
        const isProfile = item.href === "/profile";
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return <button key={item.href} className={active ? "active" : ""} onClick={() => navigate(item.href)} disabled={navigating} aria-current={active ? "page" : undefined}>
          <span className={isProfile ? "sp-nav-profile-icon" : ""} aria-hidden="true">{isProfile && avatarUrl ? <img src={avatarUrl} alt="" onError={() => setAvatarUrl("")}/> : item.icon}</span>
          <small>{item.label}</small>
        </button>;
      })}
    </nav>
  </div>;
}
