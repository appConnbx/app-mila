import type { ReactNode } from 'react'
import Link from 'next/link'
import { Aurora } from '@/components/ui'
import { getPost } from './_posts'

const SITE = 'https://www.appmila.co'

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-10 text-2xl font-bold text-white">{children}</h2>
)
export const P = ({ children }: { children: ReactNode }) => (
  <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{children}</p>
)
export const B = ({ children }: { children: ReactNode }) => <strong className="text-slate-100">{children}</strong>

/** Casca padrão de artigo: nav + cabeçalho (título/data/tag de _posts) +
 *  JSON-LD BlogPosting + CTA. O conteúdo entra como children. */
export function BlogArticleLayout({ slug, children }: { slug: string; children: ReactNode }) {
  const p = getPost(slug)!
  const url = `${SITE}/blog/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.dateISO,
    dateModified: p.dateISO,
    inLanguage: 'pt-BR',
    image: `${SITE}/opengraph-image.png`,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'appMila', url: SITE },
    publisher: { '@type': 'Organization', name: 'appMila', logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } },
  }
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-200">
      <Aurora />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
            <span className="font-bold text-white">appMila</span>
          </Link>
          <Link href="/blog" className="text-sm text-slate-400 hover:text-white">← Blog</Link>
        </nav>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-brand">{p.tag}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{p.title}</h1>
        <p className="mt-3 text-sm text-slate-500">Publicado em {p.dateLabel} · appMila</p>

        {children}

        <div className="mt-10 rounded-2xl border border-brand/30 bg-brand/10 p-6">
          <p className="text-lg font-semibold text-white">Experimente capturar sua próxima tarefa por voz</p>
          <p className="mt-1 text-sm text-slate-300">O appMila tem sistema web, app de celular e agente para computador. Comece grátis.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-brand-500">Conhecer o appMila</Link>
            <Link href="/start-family-free" className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">Começar grátis (família)</Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          <Link href="/blog" className="text-brand hover:underline">← Voltar ao blog</Link>
        </p>
      </article>
    </div>
  )
}
