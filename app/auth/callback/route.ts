import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauth = requestUrl.searchParams.get("oauth") === "1";
  const email = requestUrl.searchParams.get("email") === "verified";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  if (email) return NextResponse.redirect(new URL("/auth?email=verified", requestUrl.origin));
  if (oauth) return NextResponse.redirect(new URL("/auth?oauth=1", requestUrl.origin));
  return NextResponse.redirect(new URL("/auth", requestUrl.origin));
}
