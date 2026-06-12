import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { cbxMe, hasPerm, CBX_AREAS } from './_lib'

// Portal interno: jamais indexado (o middleware reforça com X-Robots-Tag).
export const metadata: Metadata = {
  title: 'CBX',
  robots: { index: false, follow: false },
}

export default async function CbxLayout({ children }: { children: React.ReactNode }) {
  // Quem não é da equipe CONNBX recebe 404 — o portal não admite que existe.
  const me = await cbxMe()
  if (!me.is_staff) notFound()

  const pathname = (await headers()).get('x-pathname') ?? ''
  const areas = CBX_AREAS.filter((a) => hasPerm(me, a.perm))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/cbx" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-slate-950">CX</span>
            <span className="text-lg font-bold tracking-tight text-white">CONNBX</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {areas.map((a) => {
              const active = pathname === a.href || pathname.startsWith(a.href + '/')
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active ? 'bg-amber-400/15 text-amber-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {a.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 md:inline">{me.full_name}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
