'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string }

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/')
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? 'bg-brand/15 text-brand' : 'text-slate-300 hover:bg-brand/10 hover:text-brand'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
