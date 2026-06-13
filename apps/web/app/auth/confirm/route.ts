import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Consome o token do e-mail (convite/recuperação) e estabelece a sessão (cookies),
// depois redireciona para a tela de criar senha. Cobre os dois formatos do Supabase:
// token_hash+type (verifyOtp) e code (exchangeCodeForSession).
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const origin = process.env.APP_BASE_URL || url.origin
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const code = url.searchParams.get('code')
  const lang = url.searchParams.get('lang') ?? ''
  const next = url.searchParams.get('next') || '/definir-senha'

  const supabase = await createClient()
  let ok = false
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  }

  const langQs = lang ? `${next.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}` : ''
  const dest = ok ? `${next}${langQs}` : `/definir-senha?erro=link${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`
  return NextResponse.redirect(`${origin}${dest.startsWith('/') ? dest : `/${dest}`}`, { status: 303 })
}
