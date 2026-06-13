'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { fieldClasses, labelClasses } from '@/components/ui'
import { PasswordInput } from '@/components/password-input'
import { SubmitButton } from '@/components/pending'
import { createMyFamily } from './actions'

/** Seção do perfil: colaborador corporativo cria sua conta família gratuita. */
export function FamilyAccount({ defaultName }: { defaultName: string }) {
  const t = useTranslations('profile')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && pw !== confirm

  return (
    <section className="glass mt-6 p-6">
      <div className="flex items-center gap-2">
        <span className="text-xl">🎁</span>
        <h2 className="text-lg font-semibold text-white">{t('famTitle')}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">{t('famDesc')}</p>

      <form action={createMyFamily} autoComplete="off" className="mt-4 space-y-3">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>{t('famName')}</label>
            <input name="name" defaultValue={defaultName} required autoComplete="off" className={`mt-1 ${fieldClasses}`} />
          </div>
          <div>
            <label className={labelClasses}>{t('famEmail')}</label>
            <input name="email" type="email" required autoComplete="off" placeholder="voce@email.com" className={`mt-1 ${fieldClasses}`} />
          </div>
          <div>
            <label className={labelClasses}>{t('famPassword')}</label>
            <div className="mt-1"><PasswordInput name="password" required minLength={6} value={pw} onChange={setPw} className={fieldClasses} /></div>
          </div>
          <div>
            <label className={labelClasses}>{t('famConfirm')}</label>
            <div className="mt-1"><PasswordInput name="confirm" required minLength={6} value={confirm} onChange={setConfirm} className={fieldClasses} /></div>
            {mismatch && <p className="mt-1 text-xs text-rose-400">{t('famMismatch')}</p>}
          </div>
        </div>
        <p className="text-xs text-slate-500">{t('famNote')}</p>
        <SubmitButton btnVariant="primary" disabled={mismatch}>{t('famCreate')}</SubmitButton>
      </form>
    </section>
  )
}
