'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/password-input'
import { fieldClasses } from '@/components/ui'

const MIN_PW = 8

export type SetPwDict = {
  placeholder: string
  confirmPlaceholder: string
  mismatch: string
  short: string
  submit: string
  saving: string
  expiredTitle: string
  expiredBody: string
  requestNew: string
}

export function SetPasswordForm({
  dict,
  langChoice,
  forgotHref,
}: {
  dict: SetPwDict
  langChoice?: { label: string; initial: string }
  forgotHref: string
}) {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState(langChoice?.initial ?? '')
  const [expired, setExpired] = useState(false)
  const mismatch = confirm.length > 0 && pw !== confirm

  // O link do e-mail cria uma sessão (em /auth/confirm). Se a pessoa abriu a
  // página direto, ou o token expirou entre o clique e agora, não há sessão →
  // mostra "link expirado" em vez de deixar o updateUser falhar com erro cru.
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => { if (!data.session) setExpired(true) })
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (pw.length < MIN_PW) return setErr(dict.short)
    if (pw !== confirm) return setErr(dict.mismatch)
    setLoading(true)
    const supabase = createClient()
    const { data: sess } = await supabase.auth.getSession()
    if (!sess.session) { setExpired(true); setLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) {
      // Erro de sessão/JWT = link inválido/expirado → bloco amigável.
      if (/session|jwt|token|auth/i.test(error.message)) { setExpired(true); setLoading(false); return }
      setErr(error.message)
      setLoading(false)
      return
    }
    // Onboarding internacional: persiste o idioma escolhido na conta + cookie de UI.
    if (langChoice && lang) {
      try {
        await (supabase as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<unknown> }).rpc('set_my_language', { p_lang: lang })
        document.cookie = `mila_locale=${lang}; path=/; max-age=31536000`
      } catch { /* não bloqueia o acesso */ }
    }
    router.push('/dashboard')
    router.refresh()
  }

  if (expired) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">{dict.expiredTitle}</h2>
        <p className="mt-2 text-sm text-slate-400">{dict.expiredBody}</p>
        <Link href={forgotHref} className="mt-5 inline-block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
          {dict.requestNew}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {langChoice && (
        <div>
          <label className="mb-1 block text-sm text-slate-300">{langChoice.label}</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className={fieldClasses}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      )}
      <PasswordInput
        name="password"
        value={pw}
        onChange={(v) => setPw(v)}
        placeholder={dict.placeholder}
        autoComplete="new-password"
        required
        className={fieldClasses}
      />
      <div>
        <PasswordInput
          name="confirm"
          value={confirm}
          onChange={(v) => setConfirm(v)}
          placeholder={dict.confirmPlaceholder}
          autoComplete="new-password"
          required
          className={fieldClasses}
        />
        {mismatch && <p className="mt-1 text-xs text-red-300">{dict.mismatch}</p>}
      </div>
      {err && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}
      <button
        type="submit"
        disabled={loading || mismatch || pw.length < MIN_PW}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:opacity-50"
      >
        {loading ? dict.saving : dict.submit}
      </button>
    </form>
  )
}
