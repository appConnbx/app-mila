import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Aurora } from '@/components/ui'
import { NavLinks } from './_nav'
import { exitInstance } from './dashboard/actions'
import type { Locale } from '@/i18n/config'

type Holding = { name: string; kind: 'corporate' | 'family'; legal_name: string | null }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pathname = (await headers()).get('x-pathname') ?? ''
  const activeHolding = (await cookies()).get(ACTIVE_HOLDING_COOKIE)?.value
  // "Home" = área inicial (dashboard pessoal + seleção): sem nav de instância.
  const isHome = !activeHolding || pathname === '/dashboard' || pathname.startsWith('/assinatura') || pathname.startsWith('/perfil')

  const t = await getTranslations()
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()
  const initial = (user.email ?? '?').charAt(0).toUpperCase()

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> }
  let holding: Holding | null = null
  let isHoldingAdmin = false

  if (activeHolding) {
    const { data: hData } = await supabase.from('holdings').select('name, kind, legal_name').eq('id', activeHolding).single()
    holding = hData as unknown as Holding | null
    const { data: admin } = await sb.rpc('is_holding_admin')
    isHoldingAdmin = !!admin

    if (!isHome) {
      // Guard de assinatura ativa.
      const { data: hasAccess } = await sb.rpc('holding_has_active_access')
      if (!hasAccess) redirect('/assinatura')
      // Onboarding de 1º acesso (corporativo Hotmart): configurar dados da holding.
      if (isHoldingAdmin && holding?.kind === 'corporate' && !holding?.legal_name && !pathname.startsWith('/estrutura/holding')) {
        redirect('/estrutura/holding?onboarding=1')
      }
    }
  }

  const isFamily = holding?.kind === 'family'
  const navItems = [
    { href: '/painel', label: t('nav.panel') },
    { href: '/demandas', label: t('nav.demands') },
    ...(!isFamily ? [{ href: '/eventos', label: t('nav.events') }] : []),
    ...(isHoldingAdmin ? [{ href: '/estrutura', label: t('nav.structure') }] : []),
  ]

  return (
    <div className={`min-h-screen ${isFamily ? 'theme-family' : ''}`}>
      <Aurora />
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface/70 backdrop-blur-xl">
        {/* Linha 1: marca + ações */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={isHome ? '/dashboard' : '/painel'} className="flex shrink-0 items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">MILA</span>
            <span className="h-4 w-1 rounded-full bg-brand" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isHome && holding && (
              <form action={exitInstance}>
                <button
                  type="submit"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="hidden sm:inline">{t('nav.exitInstance', { name: holding.name })}</span>
                  <span className="sm:hidden">{t('nav.exit')}</span>
                </button>
              </form>
            )}
            <LanguageSwitcher current={locale} />
            <span className="hidden text-sm text-slate-400 md:inline">{user.email}</span>
            <Link
              href="/perfil"
              title={t('nav.profile')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand transition hover:bg-brand/25"
            >
              {initial}
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {t('common.signOut')}
              </button>
            </form>
          </div>
        </div>

        {/* Linha 2: navegação da instância (oculta na home) */}
        {!isHome && <NavLinks items={navItems} />}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider>
      </main>
    </div>
  )
}
