import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Aurora } from '@/components/ui'
import { NavLinks } from './_nav'
import type { Locale } from '@/i18n/config'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> }
  const { data: isHoldingAdmin } = await sb.rpc('is_holding_admin')

  // Guard de assinatura ativa: instância sem plano ativo → tela de assinatura.
  // Pula a seleção de instância (/dashboard) e a própria /assinatura (evita loop).
  const pathname = (await headers()).get('x-pathname') ?? ''
  const activeHolding = (await cookies()).get(ACTIVE_HOLDING_COOKIE)?.value
  const guardSkip = pathname.startsWith('/dashboard') || pathname.startsWith('/assinatura')
  if (activeHolding && !guardSkip) {
    const { data: hasAccess } = await sb.rpc('holding_has_active_access')
    if (!hasAccess) redirect('/assinatura')
  }

  const t = await getTranslations()
  const locale = (await getLocale()) as Locale
  const initial = (user.email ?? '?').charAt(0).toUpperCase()

  const navItems = [
    { href: '/painel', label: t('nav.panel') },
    { href: '/demandas', label: t('nav.demands') },
    { href: '/eventos', label: t('nav.events') },
    ...(isHoldingAdmin ? [{ href: '/estrutura', label: t('nav.structure') }] : []),
  ]

  return (
    <div className="min-h-screen">
      <Aurora />
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface/70 backdrop-blur-xl">
        {/* Linha 1: marca + ações */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/painel" className="flex shrink-0 items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">MILA</span>
            <span className="h-4 w-1 rounded-full bg-brand" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher current={locale} />
            <span className="hidden text-sm text-slate-400 md:inline">{user.email}</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
              {initial}
            </div>
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

        {/* Linha 2: navegação (rolável no mobile, com item ativo destacado) */}
        <NavLinks items={navItems} />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
