import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@mila/supabase'

type CookieToSet = { name: string; value: string; options: CookieOptions }

// Rotas públicas (sem exigir login). A landing comercial é a raiz "/".
// /api/hotmart = webhook da Hotmart (autenticado por hottok, não por sessão).
// /api/agent = download do agente desktop (redirect público para a release).
const PUBLIC_PREFIXES = [
  '/login', '/auth', '/affiliates', '/api/hotmart', '/api/agent', '/privacy', '/security', '/terms', '/start', '/blog',
  // Primeiro acesso / recuperação de senha (pós-compra).
  '/welcome', '/create-password', '/forgot-password',
  // Gate de assinatura, checkout (visitante anônimo) e webhook (Stripe) são públicos; /api/stripe/portal NÃO.
  '/subscribe', '/api/stripe/checkout', '/api/stripe/webhook',
  // Transcrição do demo interativo (landing/LPs, visitante anônimo).
  '/api/demo',
  // Páginas de vendas para anúncios (públicas, por idioma/segmento).
  '/br-business', '/br-personal', '/en-business', '/en-personal', '/es-business', '/es-personal',
  // Landing institucional com idioma fixo por URL (anúncios EN/ES).
  '/en', '/es',
]

/** Renova a sessão e protege rotas (redireciona para /login se não autenticado). */
export async function updateSession(request: NextRequest) {
  // Link curto de acesso (go.appmila.co): subdomínio compartilhável dentro das
  // empresas/famílias. Redireciona para o app (raiz -> /login), preservando path.
  const host = request.headers.get('host') ?? ''
  if (host.startsWith('go.appmila')) {
    const path = request.nextUrl.pathname === '/' ? '/login' : request.nextUrl.pathname
    return NextResponse.redirect(`https://www.appmila.co${path}${request.nextUrl.search}`, 308)
  }

  // Propaga o pathname para os Server Components (guard de assinatura no layout).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  // Geo-redirect da raiz institucional: visitante FORA do Brasil cai em /en
  // (inglês) para anúncios/SEO; BR e país desconhecido (ex.: dev local) seguem
  // em pt-BR (/). Respeita escolha explícita de idioma (cookie mila_locale) e
  // não toca em /en, /es, /br-* nem rotas internas. Header da Vercel.
  if (request.nextUrl.pathname === '/' && !request.cookies.get('mila_locale')) {
    const country = request.headers.get('x-vercel-ip-country')
    if (country && country !== 'BR') {
      const url = request.nextUrl.clone()
      url.pathname = '/en'
      return NextResponse.redirect(url)
    }
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic =
    path === '/' || PUBLIC_PREFIXES.some((p) => path.startsWith(p))

  // Portal interno CONNBX: não revela a própria existência. Sem sessão → 404
  // (nunca redirect para /login) e sempre noindex. O guard de staff fica no layout.
  if (path === '/cbx' || path.startsWith('/cbx/')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/cbx-nao-existe' // rota inexistente → 404 padrão
      const nf = NextResponse.rewrite(url, { status: 404 })
      nf.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return nf
    }
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Expiração por inatividade (30 min). touch_activity registra a atividade
  // e devolve 'expired' quando passou o limite. Throttle por cookie: a RPC
  // roda no máximo 1x/min por usuário (era 1 ida ao banco por clique).
  if (user && !isPublic) {
    const lastTouch = Number(request.cookies.get('mila_touch')?.value ?? 0)
    const now = Date.now()
    if (!Number.isFinite(lastTouch) || now - lastTouch > 60_000) {
      const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: string | null }> }
      const { data: activity } = await sb.rpc('touch_activity')
      if (activity === 'expired') {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirect = NextResponse.redirect(url)
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
        return redirect
      }
      response.cookies.set('mila_touch', String(now), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60,
      })
    }
  }

  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
