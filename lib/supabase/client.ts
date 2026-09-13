import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — session is stored in localStorage under "cyenoo-auth"
 * and mirrored in cookies (via @supabase/ssr). It survives closing the PWA until
 * the user explicitly signs out or clears site data / uninstalls the app.
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
      flowType: "pkce",
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: "cyenoo-auth",
      experimental: { passkey: true },
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
    },
  });
}
