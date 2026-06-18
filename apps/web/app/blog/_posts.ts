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
  {
    slug: '5-problemas-em-casa-que-o-appmila-evita',
    title: '5 problemas que você evita em casa usando o appMila',
    description:
      'Esquecer compras, sobrecarregar uma pessoa só, combinados que viram discussão: veja 5 problemas comuns da rotina familiar e como o appMila resolve cada um com responsável, prazo e captura por voz.',
    excerpt: 'Compras esquecidas, divisão injusta, “achei que você ia fazer”: 5 dores de casa e como evitá-las.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Família',
  },
  {
    slug: '5-problemas-no-trabalho-que-o-appmila-evita',
    title: '5 problemas que você evita no trabalho usando o appMila',
    description:
      'Decisões de reunião que não viram ação, retrabalho, prazos estourados e falta de visibilidade. Veja 5 problemas que custam caro à equipe e como o appMila evita cada um.',
    excerpt: 'Decisões que somem, retrabalho, prazos estourados: 5 dores da equipe e como evitá-las.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Trabalho',
  },
  {
    slug: '10-beneficios-de-um-gestor-de-demandas',
    title: '10 benefícios de um gestor de demandas de resposta rápida',
    description:
      'Capturar em segundos, nada se perder, responsável e prazo claros, visão do status e priorização. Veja 10 benefícios de usar um gestor de demandas rápido como o appMila — no trabalho e em casa.',
    excerpt: 'Captura em segundos, nada se perde, status claro: 10 ganhos de um gestor de demandas rápido.',
    dateISO: '2026-06-18',
    dateLabel: '18 de junho de 2026',
    tag: 'Produtividade',
  },
  {
    slug: 'sistema-de-demandas-simples-vs-complexo',
    title: 'Por que escolher um sistema de demandas simples (e não um complexo)',
    description:
      'Ferramentas complexas falham porque ninguém usa. Entenda por que um sistema de demandas simples — com captura rápida, responsável, prazo e status — vence na adoção e na execução real.',
    excerpt: 'Ferramenta complexa que ninguém usa não resolve. Por que a simplicidade ganha na prática.',
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
