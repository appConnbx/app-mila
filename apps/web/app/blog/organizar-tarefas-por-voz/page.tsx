import type { Metadata } from 'next'
import Link from 'next/link'
import { Aurora } from '@/components/ui'

const URL = 'https://www.appmila.co/blog/organizar-tarefas-por-voz'
const PUBLISHED = '2026-06-18'

export const metadata: Metadata = {
  title: 'Como organizar tarefas por voz (e parar de esquecer demandas)',
  description:
    'Capturar tarefas por voz é a forma mais rápida de não perder o que foi combinado: você fala, vira demanda com responsável e prazo. Veja como funciona e como aplicar no trabalho e em casa.',
  alternates: { canonical: URL },
  openGraph: {
    type: 'article',
    title: 'Como organizar tarefas por voz (e parar de esquecer demandas)',
    description: 'Fale a tarefa; ela vira demanda com responsável e prazo. Guia prático para trabalho e família.',
    url: URL,
    siteName: 'appMila',
    locale: 'pt_BR',
  },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Como organizar tarefas por voz (e parar de esquecer demandas)',
  description:
    'Capturar tarefas por voz é a forma mais rápida de não perder o que foi combinado: você fala e vira demanda com responsável e prazo.',
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  inLanguage: 'pt-BR',
  image: 'https://www.appmila.co/opengraph-image.png',
  mainEntityOfPage: URL,
  author: { '@type': 'Organization', name: 'appMila', url: 'https://www.appmila.co' },
  publisher: {
    '@type': 'Organization',
    name: 'appMila',
    logo: { '@type': 'ImageObject', url: 'https://www.appmila.co/icon-512.png' },
  },
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 text-2xl font-bold text-white">{children}</h2>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{children}</p>
)

export default function Article() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-200">
      <Aurora />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

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
        <p className="text-sm text-brand">Produtividade</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Como organizar tarefas por voz (e parar de esquecer demandas)
        </h1>
        <p className="mt-3 text-sm text-slate-500">Publicado em 18 de junho de 2026 · appMila</p>

        {/* Resposta direta no topo — formato que o Google e a IA citam. */}
        <P>
          <strong className="text-slate-100">
            Organizar tarefas por voz significa capturar o que precisa ser feito apenas falando: você segura um botão,
            diz a tarefa e ela vira uma demanda com responsável e prazo
          </strong>{' '}
          — sem digitar, sem abrir planilha, sem depender da memória. É a forma mais rápida de não perder o que foi
          combinado em reuniões, conversas e no corre do dia a dia.
        </P>

        <H2>Por que a gente esquece o que foi combinado</H2>
        <P>
          A maioria das tarefas nasce falando — numa reunião, num corredor, num grupo de mensagens. Mas quase ninguém
          para para anotar na hora. O resultado é o clássico “achei que você ia fazer”. O problema não é falta de
          ferramenta: é o atrito entre <em>combinar</em> e <em>registrar</em>. Quanto mais passos para anotar, mais
          tarefa se perde.
        </P>

        <H2>Captura por voz reduz o atrito a zero</H2>
        <P>
          Falar é mais rápido do que digitar. Ao transformar a fala em tarefa automaticamente, você registra em
          segundos — no momento em que a demanda surge. No appMila, você segura o microfone, fala por até 10 segundos e
          solta: a transcrição vira uma demanda com título, responsável e prazo para revisar antes de criar.
        </P>

        <H2>Como aplicar no trabalho e em casa</H2>
        <P>
          No <strong className="text-slate-100">trabalho</strong>, capture as decisões de cada reunião como demandas com
          responsável e prazo, e acompanhe a execução em um só lugar — o que está aberto, em andamento e concluído. Em{' '}
          <strong className="text-slate-100">casa</strong>, a mesma lógica organiza a rotina da família: cada um sabe sua
          parte, sem cobrança. Tudo na mesma conta.
        </P>

        <H2>Passo a passo para nunca mais perder uma demanda</H2>
        <P>
          1) Capture na hora (por voz) em vez de confiar na memória. 2) Defina responsável e prazo. 3) Acompanhe o status
          até concluir. 4) Use o atalho/widget para registrar em 1 toque. É um hábito simples que elimina o “esqueci”.
        </P>

        <div className="mt-10 rounded-2xl border border-brand/30 bg-brand/10 p-6">
          <p className="text-lg font-semibold text-white">Experimente capturar sua próxima tarefa por voz</p>
          <p className="mt-1 text-sm text-slate-300">O appMila tem sistema web, app de celular e agente para computador. Comece grátis.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-brand-500">Conhecer o appMila</Link>
            <Link href="/start-family-free" className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">Começar grátis (família)</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
