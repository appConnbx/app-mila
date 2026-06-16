'use client'

import { useState, useTransition } from 'react'
import { changePassword } from './actions'

export type ChangePasswordLabels = {
  title: string
  newPw: string
  confirmPw: string
  submit: string
  success: string
  errShort: string
  errMismatch: string
  errFail: string
}

const inputCls =
  'mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'

export function ChangePassword({ labels: l }: { labels: ChangePasswordLabels }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    setMsg(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    start(async () => {
      const r = await changePassword(fd)
      if (r.ok) {
        setMsg({ ok: true, text: l.success })
        form.reset()
      } else {
        const text = r.error === 'short' ? l.errShort : r.error === 'mismatch' ? l.errMismatch : l.errFail
        setMsg({ ok: false, text })
      }
    })
  }

  return (
    <section className="glass mt-6 p-6">
      <h2 className="text-lg font-semibold text-white">{l.title}</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cp-new" className="block text-sm font-medium text-slate-300">{l.newPw}</label>
          <input id="cp-new" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
        </div>
        <div>
          <label htmlFor="cp-confirm" className="block text-sm font-medium text-slate-300">{l.confirmPw}</label>
          <input id="cp-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
        </div>
        {msg && (
          <p className={`sm:col-span-2 rounded-lg border px-3 py-2 text-sm ${msg.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
            {msg.text}
          </p>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:opacity-60"
          >
            {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-900" />}
            {l.submit}
          </button>
        </div>
      </form>
    </section>
  )
}
