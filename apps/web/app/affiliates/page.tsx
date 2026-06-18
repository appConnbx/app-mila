import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Aurora } from '@/components/ui'
import { AffiliateSimulator, type SimPlan } from '@/components/affiliate-simulator'
import { PLANS, CORP_PLANS, FAM_PLANS } from '@/lib/plans'

/* =========================================================================
   Programa de Afiliados appMila — página de recrutamento (pt-BR, mercado BR).
   Modelo de ganho:
   - BRASIL = VENDA ÚNICA (cliente parcela em 12x; afiliado recebe comissão
     sobre o valor TOTAL, de uma vez) → "faturamento direto". Posicionamento
     de sócio em cada venda.
   - INTERNACIONAL = ASSINATURA mensal em US$ → "recorrente internacional".
   Comissão padrão 25%; lançamento de junho/2026 = 50%.
   Há HIGH TICKET (Empresas) e LOW TICKET (Pessoal/Família) no mesmo produto.
   ========================================================================= */

// Links de afiliação (recrutamento Hotmart) — um por produto.
const HOTMART_AFFILIATE_BR = 'https://affiliate.hotmart.com/affiliate-recruiting/view/4255A106262858/'
const HOTMART_AFFILIATE_INTL = 'https://affiliate.hotmart.com/affiliate-recruiting/view/6593A106267603'
// Cotação de referência US$ → R$ (apenas para a estimativa em R$ do recorrente internacional).
const USD_BRL = 5.4

// Comissões REAIS praticadas pela Hotmart (já refletem as taxas da plataforma;
// não são rate × preço). Fonte: páginas de recrutamento de afiliado (jun/2026).
// BR = R$ por venda (one-time). INTL = US$/mês (recorrente). Podem variar
// conforme a modalidade de parcelamento escolhida pelo comprador.
const COMM: Record<string, { c25: number; c50: number }> = {
  'br-starter': { c25: 802.54, c50: 1605.08 },
  'br-growth': { c25: 1343.14, c50: 2686.28 },
  'br-scale': { c25: 1883.74, c50: 3767.48 },
  'br-enterprise': { c25: 3019.0, c50: 6038.0 },
  'br-family': { c25: 21.6, c50: 43.2 },
  'br-family_plus': { c25: 28.36, c50: 56.72 },
  'intl-starter': { c25: 19.47, c50: 38.95 },
  'intl-growth': { c25: 37.49, c50: 74.99 },
  'intl-scale': { c25: 75.79, c50: 151.57 },
  'intl-enterprise': { c25: 150.12, c50: 300.24 },
  'intl-family': { c25: 2.8, c50: 5.61 },
  'intl-family_plus': { c25: 3.71, c50: 7.41 },
}

export const metadata: Metadata = {
  title: 'Programa de Afiliados appMila — produto digital para promover (até 50% de comissão)',
  description:
    'Procurando um bom produto para afiliar? O appMila paga comissão cheia em cada venda no Brasil (como um sócio) e renda recorrente em dólar no internacional. 25% padrão — 50% em todas as vendas do lançamento de junho/2026. Simule seus ganhos.',
  keywords: ['programa de afiliados', 'produto para afiliado promover', 'afiliado comissão recorrente', 'produto digital para vender', 'melhor programa de afiliados', 'afiliado Hotmart'],
  alternates: { canonical: 'https://www.appmila.co/affiliates' },
  openGraph: {
    title: 'Programa de Afiliados appMila — até 50% de comissão',
    description: 'Comissão cheia em cada venda (BR) + recorrência em dólar (internacional). Simule seus ganhos como afiliado appMila.',
    url: 'https://www.appmila.co/affiliates',
    siteName: 'appMila',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

// FAQ do programa de afiliados (visível na página + JSON-LD). Mira buscas de
// quem procura "bom produto para promover" e alimenta rich result / IA.
const AFF_FAQ: { q: string; a: string }[] = [
  { q: 'O appMila é um bom produto para afiliados promoverem?', a: 'Sim. É um SaaS de produtividade (gestão de demandas por voz) com dois modelos de ganho: no Brasil o cliente paga em até 12x e o afiliado recebe comissão sobre o valor total de uma vez (venda única); no internacional é assinatura mensal em dólar, gerando renda recorrente.' },
  { q: 'Qual é a comissão de afiliado do appMila?', a: 'A comissão padrão é de 25%. No lançamento de junho de 2026, todas as vendas pagam 50%.' },
  { q: 'Como funciona a recorrência internacional?', a: 'Nas vendas internacionais (planos em dólar, assinatura mensal), o afiliado recebe comissão recorrente enquanto o cliente mantiver a assinatura ativa.' },
  { q: 'Tem produto de ticket alto e de ticket baixo?', a: 'Sim. Há planos para empresas (ticket alto, comissões maiores por venda) e planos para família/pessoal (ticket baixo, volume), no mesmo programa.' },
  { q: 'Como me torno afiliado do appMila?', a: 'A afiliação é feita pela Hotmart. Há um link de recrutamento para o produto Brasil e outro para o internacional — ambos disponíveis nesta página.' },
]
const AFF_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: AFF_FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}

// Dados do simulador: preço do plano de lib/plans.ts (fonte única); comissão de
// COMM (valores reais Hotmart). BR = venda única (R$); INTL = assinatura (US$).
const simPlans: SimPlan[] = [
  ...CORP_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `br-${slug}`, group: 'br-corp', name: p.label, currency: 'BRL', kind: 'oneTime', price: `R$${p.br!.total} · cliente paga em 12x de R$${p.br!.parcela}`, comm25: COMM[`br-${slug}`].c25, comm50: COMM[`br-${slug}`].c50 }
  }),
  ...FAM_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `br-${slug}`, group: 'br-fam', name: p.label, currency: 'BRL', kind: 'oneTime', price: `R$${p.br!.annual} · cliente paga em 12x de R$${p.br!.parcela}`, comm25: COMM[`br-${slug}`].c25, comm50: COMM[`br-${slug}`].c50 }
  }),
  ...CORP_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `intl-${slug}`, group: 'intl-corp', name: p.label, currency: 'USD', kind: 'recurring', price: `US$${p.usd}/mês`, comm25: COMM[`intl-${slug}`].c25, comm50: COMM[`intl-${slug}`].c50 }
  }),
  ...FAM_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `intl-${slug}`, group: 'intl-fam', name: p.label, currency: 'USD', kind: 'recurring', price: `US$${p.usd}/mês`, comm25: COMM[`intl-${slug}`].c25, comm50: COMM[`intl-${slug}`].c50 }
  }),
]

// Pré-preenchimento que já mostra números atraentes e ensina a usar.
const simDefaults: Record<string, number> = { 'br-growth': 1, 'br-scale': 1, 'intl-starter': 2 }

const simLabels = {
  table25Title: 'Comissão padrão — 25%',
  table50Title: '🔥 Lançamento de junho — 50% (mesmas quantidades)',
  colPlan: 'Plano',
  colPrice: 'Preço do plano',
  colCommission: 'Sua comissão',
  colQty: 'Qtd. de vendas',
  colExtract: 'Extrato',
  directLabel: 'Seu faturamento direto',
  directHint: 'Vendas no Brasil (R$) — comissão recebida de uma vez',
  recurringLabel: 'Seu recorrente internacional',
  recurringHint: 'Assinaturas em dólar — entra todo mês, enquanto o cliente usar',
  approx: '≈',
  perYear: 'em 12 meses:',
  groupBrCorp: 'Brasil · Empresas — venda única · HIGH TICKET',
  groupBrFam: 'Brasil · Pessoal / Família — venda única · LOW TICKET',
  groupIntlCorp: 'Internacional · Empresas — assinatura US$/mês · HIGH TICKET',
  groupIntlFam: 'Internacional · Pessoal / Família — assinatura US$/mês · LOW TICKET',
  hint: 'Mexa nas quantidades ↑↓ e veja seus ganhos',
  fxNote: `Os valores de comissão são os praticados pela Hotmart e já refletem as taxas da plataforma — podem variar conforme a modalidade de parcelamento escolhida pelo comprador. No Brasil a venda é única (em R$); o internacional é assinatura mensal (em US$), com estimativa em R$ a uma cotação de referência de US$1 = R$${USD_BRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Simulação ilustrativa — não constitui garantia de ganho.`,
}

// Bloco de lançamento — entra entre a tabela de 25% e a de 50% no simulador.
const launchBlock: ReactNode = (
  <div className="relative overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-amber-500/[0.06] to-transparent p-8 text-center sm:p-12">
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
      Somente em junho/2026
    </span>
    <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
      Sua comissão sobe para <span className="text-amber-300">50%</span>.
    </h2>
    <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">
      No mês de lançamento, <strong className="text-amber-200">toda venda fechada em junho/2026 rende 50% de comissão</strong>.
      No Brasil, é o dobro do faturamento direto em cada venda. No internacional, esses 50% valem
      <strong className="text-amber-200"> para sempre</strong> — em cada renovação, pela vida inteira do cliente.
    </p>
    <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
      Depois de junho, a comissão volta aos 25%. As assinaturas internacionais que você fechar agora continuam pagando 50%.
      Essa janela não volta. Veja abaixo o mesmo cenário com 50%.
    </p>
  </div>
)

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
    </div>
  )
}

function ProductCard({ tier, market, desc, price, unit }: { tier: 'HIGH TICKET' | 'LOW TICKET'; market: string; desc: string; price: string; unit: string }) {
  const high = tier === 'HIGH TICKET'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{market}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${high ? 'bg-amber-500/15 text-amber-300' : 'bg-brand/15 text-brand'}`}>{tier}</span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
      <p className="mt-3 text-2xl font-extrabold text-white">{price}<span className="text-sm font-medium text-slate-400">{unit}</span></p>
    </div>
  )
}

export default function AffiliatesPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-200">
      <Aurora />

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
            <span className="text-lg font-bold tracking-tight text-white">appMila</span>
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center lg:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Mês de lançamento · Oportunidade exclusiva · Junho/2026
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.07] tracking-tight text-white sm:text-5xl">
            Não é mais um produto para afiliar.
            <span className="mt-2 block bg-gradient-to-r from-brand to-amber-400 bg-clip-text text-transparent">
              É uma fonte de renda que cresce com você.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Você fatura de <strong className="text-white">duas formas</strong>: comissão cheia em cada venda no Brasil — como um
            <strong className="text-white"> sócio</strong> do negócio — e <strong className="text-white">renda recorrente em dólar</strong> no
            internacional.
          </p>
          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <li className="inline-flex items-center gap-1.5"><span className="text-brand">✓</span> Sócio em cada venda (Brasil)</li>
            <li className="inline-flex items-center gap-1.5"><span className="text-brand">✓</span> Recorrência em dólar (internacional)</li>
            <li className="inline-flex items-center gap-1.5"><span className="text-brand">✓</span> Arsenal de apoio pronto</li>
          </ul>
        </div>
      </section>

      {/* POR QUE appMila — dois motores de ganho */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Por que vender appMila</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">Você não ganha de um jeito só. Ganha de dois.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            No Brasil, você entra como sócio de cada venda. No mundo, constrói uma renda recorrente em dólar. E faz isso com
            high ticket e low ticket dentro do mesmo produto.
          </p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Sócio em cada venda (Brasil)">
            No Brasil a venda é única: o cliente parcela em até 12x, mas a sua comissão incide sobre o valor total do plano e cai
            de uma vez. Quanto maior o plano, maior o seu corte. Você não é só divulgador — é parte do negócio.
          </Card>
          <Card title="Recorrência em dólar (internacional)">
            Lá fora o appMila é assinatura mensal. Cada cliente que você indica paga você todo mês, em dólar, enquanto usar. Indique
            uma vez, receba muitas. É a renda que se acumula.
          </Card>
          <Card title="High ticket e low ticket, no mesmo produto">
            Empresas são high ticket (tickets de milhares de reais); pessoal/família é low ticket (entrada baixa, volume alto).
            Você escolhe onde atacar — ou faz os dois e equilibra sua carteira.
          </Card>
          <Card title="Sistema multilíngue: pt / en / es">
            Todo o appMila funciona em português, inglês e espanhol. Você vende no Brasil e no mundo com o mesmo produto, sem
            barreira de idioma — e abre a porta do faturamento em dólar.
          </Card>
          <Card title="Produto que as pessoas usam todo dia">
            Capturar tarefa por voz resolve uma dor real de empresas e famílias. Uso diário significa cliente satisfeito — e, no
            internacional, assinatura que renova e te paga por mais tempo.
          </Card>
          <Card title="Time, suporte e arsenal por trás">
            Uma equipe evolui o produto (web, desktop e o app Android) e atende quem você trouxe. Você recebe manual da marca, tom
            de voz, logos, LPs por produto e prompts de IA para vender mais e melhor.
          </Card>
        </div>
      </section>

      {/* A OPORTUNIDADE / SÓCIO E CONSULTOR */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">A oportunidade</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Entre como sócio. Cresça como consultor.</h2>
          <div className="mt-4 space-y-3 leading-relaxed text-slate-300">
            <p>
              Você pode divulgar o appMila como faz com qualquer produto: seu link, suas redes, sua audiência. No Brasil, cada venda
              já te coloca como <strong className="text-white">sócio do resultado</strong> — comissão cheia sobre o valor total,
              recebida de uma vez.
            </p>
            <p>
              Quem vai além e atua como <strong className="text-white">consultor de produtividade</strong> — entende a dor da
              empresa, mostra o ganho de organização, acompanha a implantação — fecha tickets maiores e, no internacional,
              constrói uma <strong className="text-white">carteira de assinaturas recorrentes em dólar</strong>. Aí o jogo muda de
              patamar.
            </p>
            <p>
              É a diferença entre tirar uma comissão e montar uma operação: faturamento direto que entra a cada venda no Brasil,
              somado a uma renda mensal em dólar que se acumula lá fora.
            </p>
          </div>
          <p className="mt-5 text-sm font-semibold text-brand">Você escolhe o tamanho da operação. Nós damos o produto, o material e o suporte.</p>
        </div>
      </section>

      {/* PRODUTOS E PLANOS */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">O que você vende</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">Quatro frentes de venda, um só link de afiliado</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            No Brasil, venda única (valor total do plano; o cliente é quem parcela). No internacional, assinatura mensal em dólar.
            Em cada mercado há high ticket (empresas) e low ticket (pessoal/família).
          </p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProductCard tier="HIGH TICKET" market="Brasil · Empresas" desc="Venda única. Planos do Starter ao Enterprise." price={`R$${PLANS.starter.br!.total}–${PLANS.enterprise.br!.total}`} unit=" / total" />
          <ProductCard tier="LOW TICKET" market="Brasil · Família" desc="Venda única. Uso pessoal/familiar." price={`R$${PLANS.family.br!.annual}–${PLANS.family_plus.br!.annual}`} unit=" / total" />
          <ProductCard tier="HIGH TICKET" market="Internacional · Empresas" desc="Assinatura mensal em dólar." price={`US$${PLANS.starter.usd}–${PLANS.enterprise.usd}`} unit=" /mês" />
          <ProductCard tier="LOW TICKET" market="Internacional · Família" desc="Assinatura mensal em dólar." price={`US$${PLANS.family.usd}–${PLANS.family_plus.usd}`} unit=" /mês" />
        </div>
      </section>

      {/* SIMULADOR (25% → bloco de lançamento → 50%) */}
      <section id="simulador" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Simule agora</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">Quanto você fatura — direto e recorrente?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Monte seu cenário: vendas no Brasil viram <strong className="text-white">faturamento direto</strong>; assinaturas
            internacionais viram <strong className="text-white">recorrente em dólar</strong>. Brinque com as quantidades — é assim
            que sua operação se parece.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs text-slate-500">
            Os valores são as comissões reais da Hotmart (já com as taxas da plataforma) e podem variar conforme a modalidade de
            parcelamento escolhida pelo comprador.
          </p>
        </div>
        <div className="mt-9">
          <AffiliateSimulator plans={simPlans} fx={USD_BRL} defaults={simDefaults} labels={simLabels} middle={launchBlock} />
        </div>
      </section>

      {/* CTA pós-simulador */}
      <section className="mx-auto max-w-4xl px-4 pb-2 text-center">
        <a href="#afiliar" className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
          Garantir meus 50% de junho
        </a>
      </section>

      {/* ARSENAL DE APOIO */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Você não vende sozinho</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">O arsenal que vem junto com a sua afiliação</h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Manual da marca + logos">Identidade visual, cores e versões do logo para você criar material com a cara do appMila.</Card>
          <Card title="Tom de voz">Como o appMila fala. Você comunica com consistência e profissionalismo desde o primeiro post.</Card>
          <Card title="Prompts de IA">Prompts prontos para gerar copy, anúncios, roteiros e estratégia de campanha em minutos.</Card>
          <Card title="Páginas de vendas por produto">LPs prontas para empresa e pessoal, Brasil e exterior, em pt/en/es — é só usar o seu link.</Card>
          <Card title="Demonstração interativa">O cliente testa a captura por voz na hora, direto na página. Sua conversão agradece.</Card>
          <Card title="Atualizações constantes">Produto e materiais evoluem. Você sempre tem novidade para reaquecer a audiência.</Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-3xl font-bold text-white">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {[
            { q: 'Como funciona a comissão?', a: 'No Brasil a venda é única: você recebe a comissão sobre o plano de uma vez (o cliente é quem parcela em até 12x). No internacional o appMila é assinatura mensal em dólar: você recebe a comissão recorrente todo mês, enquanto o cliente mantiver a assinatura. Os valores exibidos no simulador são os praticados pela Hotmart (já com as taxas da plataforma) e podem variar conforme a modalidade de parcelamento escolhida pelo comprador.' },
            { q: 'O que muda no lançamento de junho/2026?', a: 'Em junho a comissão sobe para 50% em todas as vendas. No Brasil, é o dobro do faturamento direto por venda. No internacional, esses 50% valem para sempre — em cada renovação da assinatura que você fechar em junho. Depois do mês, novas vendas voltam a 25%.' },
            { q: 'O que é high ticket e low ticket?', a: 'O mesmo produto tem planos de empresa (high ticket, valores maiores) e de uso pessoal/família (low ticket, entrada baixa e volume). Você pode focar em um, ou trabalhar os dois para equilibrar valor por venda e volume.' },
            { q: 'Preciso ser especialista para vender?', a: 'Não. Você pode divulgar como já faz com qualquer produto. Quem quiser ir além, atuando como consultor, tende a fechar tickets maiores e construir carteira recorrente — e damos o material para isso.' },
            { q: 'Posso vender para fora do Brasil?', a: 'Sim. Todo o sistema é multilíngue (português, inglês e espanhol) e há planos internacionais em dólar, para empresas e uso pessoal. Sua comissão sobre essas vendas entra em US$ e é recorrente.' },
            { q: 'Como recebo?', a: 'O pagamento e o rastreio das vendas são feitos pela Hotmart, segundo as regras e prazos da plataforma. É só se afiliar com o seu link.' },
          ].map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-white">
                {f.q}
                <span className="shrink-0 text-lg text-brand transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL — AFILIAÇÃO HOTMART */}
      <section id="afiliar" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14">
        <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.08] to-white/[0.03] p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">Pronto para faturar direto e recorrente?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Afilie-se agora na Hotmart e garanta os <strong className="text-amber-200">50% em todas as vendas de junho/2026</strong>.
            São <strong className="text-white">dois produtos</strong> — afilie-se aos dois para faturar no Brasil e no mundo.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={HOTMART_AFFILIATE_BR}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-4 text-base font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Afiliar-se · Produto Brasil
            </a>
            <a
              href={HOTMART_AFFILIATE_INTL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 px-8 py-4 text-base font-bold text-amber-200 transition hover:bg-amber-400/10"
            >
              Afiliar-se · Produto Internacional
            </a>
          </div>
          <div className="mt-4">
            <a href="#simulador" className="text-sm font-semibold text-slate-300 underline-offset-4 transition hover:text-white hover:underline">
              Simular meus ganhos de novo
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Comissões processadas pela Hotmart, conforme regras e prazos da plataforma.</p>
        </div>
      </section>

      {/* FAQ (visível + JSON-LD para rich result / IA) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(AFF_FAQ_JSONLD) }} />
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Perguntas frequentes</h2>
        <div className="mt-6 space-y-3">
          {AFF_FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer list-none font-semibold text-slate-100 marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-10 text-xs text-slate-500">
          <p className="text-slate-400">
            Simulações e valores são ilustrativos e não constituem garantia de ganho. No Brasil a venda é única (o cliente parcela
            em até 12x); no internacional é assinatura recorrente em dólar. Resultados dependem do seu esforço de divulgação, das
            vendas efetivas, de aprovações, reembolsos e renovações, e das regras da Hotmart.
          </p>
          <p>appMila · Programa de Afiliados</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/" className="hover:text-white">Conhecer o appMila</Link>
            <Link href="/privacy" className="hover:text-white">Privacidade</Link>
            <Link href="/security" className="hover:text-white">Segurança</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
