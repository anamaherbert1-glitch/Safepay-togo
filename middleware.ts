import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh Supabase auth cookies on every navigation so the session
 * survives app close / reopen until the user explicitly signs out.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Keep cookies ~1 year so closing the PWA does not drop the session
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 365,
              path: options?.path ?? "/",
              sameSite: options?.sameSite ?? "lax",
            });
          });
        },
      },
    });

    // Touches / refreshes the session if needed
    await supabase.auth.getUser();
  } catch {
    // Never block navigation on auth middleware errors
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|icon-192|apple-icon|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
