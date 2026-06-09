import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Aurora } from '@/components/ui'
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

  const t = await getTranslations()
  const locale = (await getLocale()) as Locale
  const initial = (user.email ?? '?').charAt(0).toUpperCase()

  const navLink = 'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white'

  return (
    <div className="min-h-screen bg-surface">
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

        {/* Linha 2: navegação (rolável no mobile) */}
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          <Link href="/painel" className={navLink}>{t('nav.panel')}</Link>
          <Link href="/demandas" className={navLink}>{t('nav.demands')}</Link>
          <Link href="/eventos" className={navLink}>{t('nav.events')}</Link>
          {isHoldingAdmin && (
            <Link href="/estrutura" className={navLink}>{t('nav.structure')}</Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
