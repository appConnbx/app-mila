'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fieldClasses } from '@/components/ui'

export type RecoverDict = { email: string; submit: string; sent: string; sending: string }

export function RecoverForm({ dict, lang }: { dict: RecoverDict; lang?: string }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const next = encodeURIComponent('/definir-senha')
    const langQs = lang ? `&lang=${encodeURIComponent(lang)}` : ''
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${next}${langQs}`,
    })
    // Mensagem neutra (não revela se o e-mail existe).
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
        {dict.sent}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.email}
        className={fieldClasses}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:opacity-50"
      >
        {loading ? dict.sending : dict.submit}
      </button>
    </form>
  )
}
