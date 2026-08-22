import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") || "/auth?email=verified";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth?error=Le lien de vérification est incomplet.", request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent("Le lien de vérification est expiré ou invalide. Demandez un nouvel email.")}`, request.url),
    );
  }

  const safeNext = next.startsWith("/") ? next : "/auth?email=verified";
  return NextResponse.redirect(new URL(safeNext, request.url));
}
