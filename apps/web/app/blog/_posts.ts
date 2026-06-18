import type { Metadata } from 'next'

const SITE = 'https://www.appmila.co'

export type Post = {
  slug: string
  title: string
  description: string
  excerpt: string
  dateISO: string
  dateLabel: string
  tag: string
}

// Fonte única dos artigos: alimenta o índice (/blog), o sitemap e a metadata
// de cada post. Para publicar um novo artigo: adicione aqui + crie a página
// app/blog/<slug>/page.tsx usando BlogArticleLayout.
export const POSTS: Post[] = [
  {
    slug: 'organizar-tarefas-por-voz',
    title: 'Como organizar tarefas por voz (e parar de esquecer demandas)',
    description:
      'Capturar tarefas por voz é a forma mais rápida de não perder o que foi combinado: você fala, vira demanda com responsável e prazo. Veja como funciona e como aplicar no trabalho e em casa.',
    excerpt: 'Você fala, vira demanda com responsável e prazo. O jeito mais rápido de não perder o que foi combinado.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Produtividade',
  },
  {
    slug: 'nao-perder-tarefas-no-trabalho',
    title: 'Como não perder tarefas no trabalho: um sistema simples de demandas',
    description:
      'Tarefas se perdem entre reuniões, mensagens e a memória. Veja um método simples para capturar, delegar com prazo e acompanhar a execução da equipe até concluir.',
    excerpt: 'Capture, delegue com prazo e acompanhe até concluir — o método para a equipe parar de perder demanda.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Trabalho',
  },
  {
    slug: 'organizar-tarefas-em-familia',
    title: 'Organização de tarefas em família: como dividir sem virar cobrança',
    description:
      'Da lista de compras ao dever de casa: como organizar as tarefas da família para que cada um saiba sua parte, com prazo e lembrete, sem brigas nem “achei que você ia fazer”.',
    excerpt: 'Cada um sabe sua parte, com prazo e lembrete — sem cobrança. Como organizar a rotina da família.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Família',
  },
  {
    slug: 'transformar-reunioes-em-tarefas',
    title: 'Como transformar reuniões em tarefas que realmente são feitas',
    description:
      'A maioria das decisões de reunião nunca vira ação. Veja como capturar cada combinado como uma demanda com responsável e prazo — e acompanhar a execução depois que a reunião acaba.',
    excerpt: 'Toda decisão de reunião com dono e prazo. Como garantir que o combinado vire execução.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Gestão',
  },
]

export const getPost = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug)

export function postMetadata(slug: string): Metadata {
  const p = getPost(slug)!
  const url = `${SITE}/blog/${slug}`
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: p.title, description: p.description, url, siteName: 'appMila', locale: 'pt_BR' },
  }
}
