import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client with durable session storage.
 * Session stays on the device until the user explicitly signs out
 * (or uninstalls the app / clears site data).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const isBrowser = typeof window !== "undefined";

  return createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // localStorage survives closing the PWA / browser tab
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: "cyenoo-auth",
      experimental: { passkey: true },
    },
    // Cookies also kept long-lived for SSR / next navigations
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 400, // ~400 days
      path: "/",
      sameSite: "lax",
    },
  });
}
