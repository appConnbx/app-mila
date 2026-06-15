'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PasswordInput } from '@/components/password-input'
import { signupFamilyFree } from './actions'

const COUNTRIES = [
  'Brasil', 'Portugal', 'Estados Unidos', 'Argentina', 'Chile', 'Colômbia',
  'México', 'Paraguai', 'Uruguai', 'Espanha', 'Outro',
]

const field =
  'w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60'
const label = 'block text-xs font-semibold uppercase tracking-wide text-slate-400'

type Dict = Record<string, string>

export function SignupForm({ dict }: { dict: Dict }) {
  const [country, setCountry] = useState('Brasil')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const isBR = country === 'Brasil'
  const mismatch = confirm.length > 0 && pw !== confirm

  return (
    // autoComplete off: evita o navegador injetar credenciais salvas no cadastro.
    <form action={signupFamilyFree} autoComplete="off" className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div>
        <label htmlFor="sf-name" className={label}>{dict.name}</label>
        <input id="sf-name" name="name" required autoComplete="off" className={`mt-1 ${field}`} placeholder={dict.namePh} />
      </div>
      <div>
        <label htmlFor="sf-email" className={label}>{dict.email}</label>
        <input id="sf-email" name="email" type="email" required autoComplete="off" className={`mt-1 ${field}`} placeholder="voce@email.com" />
      </div>
      <div>
        <label className={label}>{dict.password}</label>
        <div className="mt-1">
          <PasswordInput name="password" required minLength={8} value={pw} onChange={setPw} className={field} placeholder={dict.passwordPh} />
        </div>
      </div>
      <div>
        <label className={label}>{dict.confirm}</label>
        <div className="mt-1">
          <PasswordInput name="confirm" required minLength={8} value={confirm} onChange={setConfirm} className={field} placeholder={dict.confirmPh} />
        </div>
        {mismatch && <p className="mt-1 text-xs text-rose-400">{dict.mismatch}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sf-country" className={label}>{dict.country}</label>
          <select id="sf-country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={`mt-1 ${field}`}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sf-doc" className={label}>{isBR ? dict.doc : dict.docOther}</label>
          <input
            id="sf-doc"
            name="document"
            required
            autoComplete="off"
            inputMode={isBR ? 'numeric' : 'text'}
            className={`mt-1 ${field}`}
            placeholder={isBR ? dict.docPh : dict.docPhOther}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {dict.consentPre}{' '}
        <a href="/privacy" className="text-cyan-400 hover:underline">{dict.privacy}</a>.
      </p>

      <button
        type="submit"
        disabled={mismatch}
        className="w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {dict.submit}
      </button>
      <p className="text-center text-xs text-slate-500">{dict.note}</p>

      <p className="text-center text-sm text-slate-500">
        {dict.morePlansPre} <Link href="/#pessoal" className="text-cyan-400 hover:underline">{dict.morePlansLink}</Link>
      </p>
    </form>
  )
}
