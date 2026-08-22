import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthMode = requestUrl.searchParams.get("oauth");
  const emailVerified = requestUrl.searchParams.get("email") === "verified";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error || errorDescription) {
    const message = errorDescription || error || "Authentification impossible.";
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(message)}`, requestUrl.origin));
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin));
    }
  }

  if (emailVerified) return NextResponse.redirect(new URL("/auth?email=verified", requestUrl.origin));
  if (oauthMode === "login") return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  if (oauthMode === "1") return NextResponse.redirect(new URL("/auth?oauth=1", requestUrl.origin));
  return NextResponse.redirect(new URL("/auth", requestUrl.origin));
}
