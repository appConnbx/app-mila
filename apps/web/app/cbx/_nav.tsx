'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string }

/** Navegação do portal: usa o pathname do cliente (o destaque acompanha a rota). */
export function CbxNav({ items }: { items: Item[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/')
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? 'bg-amber-400/15 text-amber-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
