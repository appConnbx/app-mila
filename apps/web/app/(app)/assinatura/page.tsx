import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui'

export default async function AssinaturaPage() {
  const t = await getTranslations('billing')

  return (
    <div className="mx-auto mt-10 max-w-lg">
      <div className="glass glow-top p-8 text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 text-2xl">⚠️</div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">{t('desc')}</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">{t('suspended')}</p>

        <div className="mt-7 flex flex-col items-center gap-2">
          <a
            href="https://consumer.hotmart.com/purchases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {t('manage')}
          </a>
          <Button href="/dashboard" variant="secondary" className="w-full">{t('switch')}</Button>
          <a href="mailto:suporte@appmila.co" className="mt-1 text-xs text-slate-500 transition hover:text-slate-300">
            {t('help')}
          </a>
        </div>
      </div>
    </div>
  )
}
