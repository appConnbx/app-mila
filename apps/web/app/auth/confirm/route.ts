import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Consome o token do e-mail (convite/recuperação) e estabelece a sessão (cookies),
// depois redireciona para a tela de criar senha. Cobre os dois formatos do Supabase:
// token_hash+type (verifyOtp) e code (exchangeCodeForSession).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = process.env.APP_BASE_URL || url.origin;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const lang = url.searchParams.get("lang") ?? "";
  // Só aceita caminho interno (evita open-redirect via next=//evil.com).
  const rawNext = url.searchParams.get("next") || "/create-password";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/create-password";

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const langQs = lang ? `${next.includes("?") ? "&" : "?"}lang=${encodeURIComponent(lang)}` : "";
  const dest = ok
    ? `${next}${langQs}`
    : `/create-password?erro=link${lang ? `&lang=${encodeURIComponent(lang)}` : ""}`;
  return NextResponse.redirect(`${origin}${dest.startsWith("/") ? dest : `/${dest}`}`, {
    status: 303,
  });
}
