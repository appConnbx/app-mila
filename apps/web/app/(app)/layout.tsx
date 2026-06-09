import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const initial = (user.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">MILA</span>
          <span className="h-4 w-1 rounded-full bg-brand" />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-surface-border bg-slate-900/60 px-3 py-1.5 text-sm text-slate-500 sm:flex">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Buscar…</span>
          </div>
          <span className="hidden text-sm text-slate-400 md:inline">{user.email}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
            {initial}
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
