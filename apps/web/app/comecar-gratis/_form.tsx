'use client'

import { useState } from 'react'
import { signupFamilyFree } from './actions'

const COUNTRIES = [
  'Brasil', 'Portugal', 'Estados Unidos', 'Argentina', 'Chile', 'Colômbia',
  'México', 'Paraguai', 'Uruguai', 'Espanha', 'Outro',
]

const field =
  'w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60'
const label = 'block text-xs font-semibold uppercase tracking-wide text-slate-400'

export function SignupForm() {
  const [country, setCountry] = useState('Brasil')
  const isBR = country === 'Brasil'

  return (
    <form action={signupFamilyFree} className="space-y-4">
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div>
        <label className={label}>Seu nome</label>
        <input name="name" required className={`mt-1 ${field}`} placeholder="Nome completo" />
      </div>
      <div>
        <label className={label}>E-mail</label>
        <input name="email" type="email" required className={`mt-1 ${field}`} placeholder="voce@email.com" />
      </div>
      <div>
        <label className={label}>Senha</label>
        <input name="password" type="password" required minLength={6} className={`mt-1 ${field}`} placeholder="Mínimo 6 caracteres" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>País</label>
          <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={`mt-1 ${field}`}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>{isBR ? 'CPF' : 'Documento de identificação'}</label>
          <input
            name="document"
            required
            inputMode={isBR ? 'numeric' : 'text'}
            className={`mt-1 ${field}`}
            placeholder={isBR ? 'Somente números' : 'Documento oficial'}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        O documento é usado apenas para validar a conta gratuita e fica restrito à equipe CONNBX —
        nunca aparece no aplicativo. Ao continuar, você concorda com a{' '}
        <a href="/privacidade" className="text-cyan-400 hover:underline">Política de Privacidade</a>.
      </p>

      <button
        type="submit"
        className="w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
      >
        Criar minha conta gratuita
      </button>
      <p className="text-center text-xs text-slate-500">
        Plano gratuito: 1 usuário · até 15 demandas por dia. Sem cartão.
      </p>
    </form>
  )
}
