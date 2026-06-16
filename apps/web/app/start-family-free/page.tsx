import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SignupForm } from './_form'

export const metadata: Metadata = {
  title: 'Family Free · appMila',
  description: 'Crie sua conta gratuita do appMila: 1 usuário e até 15 demandas por dia.',
}

const DICT_KEYS = [
  'name', 'namePh', 'email', 'password', 'passwordPh', 'confirm', 'confirmPh', 'mismatch',
  'country', 'doc', 'docOther', 'docPh', 'docPhOther', 'consentPre', 'privacy',
  'submit', 'note', 'morePlansPre', 'morePlansLink',
] as const

const ERR: Record<string, string> = {
  campos: 'errCampos', senha: 'errSenha', confirm: 'errConfirm', cpf: 'errCpf',
  email_existe: 'errEmailExiste', doc_existe: 'errDocExiste', generico: 'errGenerico',
  muitas: 'errMuitas',
}

export default async function StartFamilyFreePage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const t = await getTranslations('freesignup')
  const { err } = await searchParams
  const errMsg = err && ERR[err] ? t(ERR[err]) : null
  const dict = Object.fromEntries(DICT_KEYS.map((k) => [k, t(k)])) as Record<string, string>

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">appMila</span>
            <span className="h-4 w-1 rounded-full bg-cyan-400" />
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {errMsg && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {errMsg}
              {err === 'email_existe' && (
                <> <Link href="/login" className="font-semibold underline">{t('goLogin')}</Link>.</>
              )}
            </div>
          )}
          <SignupForm dict={dict} />
        </div>
      </div>
    </main>
  )
}
