"use client";

import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Single browser client. Session is stored ONLY in localStorage (key: cyenoo-auth).
 * Survives close/reopen of the PWA until explicit signOut or uninstall / clear site data.
 */
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (typeof window === "undefined") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createSupabaseJsClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  browserClient = createSupabaseJsClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "cyenoo-auth",
      flowType: "pkce",
      // Enable experimental passkeys so the SDK does not spam the UI with warnings
      // when biometric features are used. Actual availability still depends on device.
      // @ts-expect-error experimental flag supported by recent supabase-js
      experimental: { passkeys: true },
    },
  });

  return browserClient;
}
