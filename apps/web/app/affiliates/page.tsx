import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Aurora } from '@/components/ui'
import { AffiliateSimulator, type SimPlan } from '@/components/affiliate-simulator'
import { PLANS, CORP_PLANS, FAM_PLANS } from '@/lib/plans'

/* =========================================================================
   Programa de Afiliados MILA — página de recrutamento (pt-BR, mercado BR).
   Objetivo: converter o afiliado a QUERER vender o MILA. Narrativa:
   produto poderoso e em evolução → oportunidade de renda recorrente →
   simulador 35% → grande triunfo (50% vitalício de junho) → simulador 50%
   → arsenal de apoio → afiliação na Hotmart.
   ========================================================================= */

// ⚙️ AJUSTE AQUI (placeholders marcados):
// 1) Link de afiliação do programa Hotmart. Hoje aponta para a página do produto
//    (P106262837P). Troque pelo link de "Quero divulgar / Afiliar-se" real.
const HOTMART_AFFILIATE_URL = 'https://hotmart.com/pt-br/marketplace/produtos/mila/P106262837P'
// 2) Cotação de referência US$ → R$ usada na coluna "Extrato (R$)" do simulador.
const USD_BRL = 5.4

export const metadata: Metadata = {
  title: 'Seja Afiliado MILA — 35% recorrente (50% vitalício em junho)',
  description:
    'Mais que um produto para afiliar: uma renda recorrente que cresce com você. 35% de comissão sobre toda a recorrência — e 50% vitalício em todas as vendas de junho. Simule seus ganhos.',
  robots: { index: true, follow: true },
}

// Converte "1.117" → 1117 e "8,08" → 8.08 (formato BR).
const brNum = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'))

// Dados do simulador derivados da fonte única (lib/plans.ts).
const simPlans: SimPlan[] = [
  ...CORP_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `br-${slug}`, group: 'br-corp', name: p.label, currency: 'BRL', base: brNum(p.br!.parcela!), price: `R$${p.br!.parcela}/mês · anual (12x)` }
  }),
  ...FAM_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `br-${slug}`, group: 'br-fam', name: p.label, currency: 'BRL', base: brNum(p.br!.parcela!), price: `R$${p.br!.annual}/ano · 12x de R$${p.br!.parcela}` }
  }),
  ...CORP_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `intl-${slug}`, group: 'intl-corp', name: p.label, currency: 'USD', base: Number(p.usd), price: `US$${p.usd}/mês` }
  }),
  ...FAM_PLANS.map((slug): SimPlan => {
    const p = PLANS[slug]
    return { id: `intl-${slug}`, group: 'intl-fam', name: p.label, currency: 'USD', base: Number(p.usd), price: `US$${p.usd}/mês` }
  }),
]

// Pré-preenchimento que já mostra um número atraente e ensina a usar.
const simDefaults: Record<string, number> = { 'br-growth': 2, 'br-scale': 1, 'intl-starter': 1 }

const simLabels = {
  table35Title: 'Comissão padrão — 35% recorrente',
  table50Title: '🔥 Lançamento de junho — 50% VITALÍCIO (mesmas quantidades)',
  colPlan: 'Plano',
  colPrice: 'Preço do plano',
  colCommission: 'Sua comissão (unidade)',
  colQty: 'Qtd. de vendas',
  colExtract: 'Extrato (R$)',
  totalLabel: 'Sua renda recorrente mensal',
  perYear: 'Equivale a',
  groupBrCorp: 'Brasil · Empresas (Hotmart, anual 12x)',
  groupBrFam: 'Brasil · Pessoal / Família (Hotmart, anual)',
  groupIntlCorp: 'Internacional · Empresas (assinatura mensal em US$)',
  groupIntlFam: 'Internacional · Pessoal / Família (mensal em US$)',
  deltaLabel: 'Você ganha a mais:',
  fxNote: `Simulação ilustrativa. Planos internacionais convertidos a uma cotação de referência de US$1 = R$${USD_BRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Comissões dependem de vendas efetivas, aprovação e regras da Hotmart, reembolsos e renovações — não constituem garantia de ganho.`,
  hint: 'Mexa nas quantidades ↑↓ e veja sua renda subir',
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
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
            <span className="text-lg font-bold tracking-tight text-white">MILA</span>
          </Link>
          <a href="#afiliar" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
            Quero ser afiliado
          </a>
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
            Lançamento de junho · 50% de comissão vitalícia
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.07] tracking-tight text-white sm:text-5xl">
            Não é mais um produto para afiliar.
            <span className="mt-2 block bg-gradient-to-r from-brand to-amber-400 bg-clip-text text-transparent">
              É uma renda recorrente que cresce com você.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            O MILA transforma voz em demanda organizada para empresas e famílias — no Brasil e no mundo. Você ganha
            <strong className="text-white"> 35% de comissão sobre toda a recorrência</strong>, mês após mês. Indique uma vez,
            receba enquanto o cliente usar.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#simulador" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
              Simular meus ganhos
            </a>
            <a href="#afiliar" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
              Afiliar-se na Hotmart
            </a>
          </div>
          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <li className="inline-flex items-center gap-1.5"><span className="text-brand">✓</span> Recorrência previsível</li>
            <li className="inline-flex items-center gap-1.5"><span className="text-brand">✓</span> Ganhe também em dólar</li>
            <li className="inline-flex items-center gap-1.5"><span className="text-brand">✓</span> Arsenal de apoio pronto</li>
          </ul>
        </div>
      </section>

      {/* POR QUE MILA — o que importa para o afiliado (base da pesquisa) */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Por que vender MILA</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">O afiliado inteligente escolhe recorrência — e produto que evolui</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Comissão única acaba no dia seguinte. Recorrência se acumula. E recorrência sobre um produto que melhora toda semana
            vira uma carteira que trabalha por você.
          </p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Renda recorrente, não venda avulsa">
            35% sobre cada cobrança, enquanto o cliente permanecer. Uma única indicação paga você por meses — e anos.
          </Card>
          <Card title="Produto que as pessoas usam todo dia">
            Capturar tarefa por voz resolve uma dor real de empresas e famílias. Uso diário = baixa evasão = sua comissão dura mais.
          </Card>
          <Card title="Time dedicado de produto">
            Uma equipe de engenharia evolui o MILA continuamente: web, desktop e o app oficial Android. Você vende algo que só melhora.
          </Card>
          <Card title="Suporte de verdade por trás">
            Equipe de suporte e onboarding cuidam do cliente que você trouxe. Cliente bem atendido renova — e renovação é o seu salário.
          </Card>
          <Card title="Estratégia internacional (ganhe em US$)">
            Planos no Brasil (R$) e no mundo (US$). Indicou um cliente lá fora? Sua comissão entra em dólar. Poucos programas BR oferecem isso.
          </Card>
          <Card title="Arsenal de apoio pronto">
            Manual da marca, tom de voz, logos, páginas de vendas por produto e prompts de IA para você criar campanha em minutos.
          </Card>
        </div>
      </section>

      {/* A OPORTUNIDADE / NARRATIVA DE CONSULTOR */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">A oportunidade</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Trabalhe como já trabalha. Ou mude de patamar.</h2>
          <div className="mt-4 space-y-3 leading-relaxed text-slate-300">
            <p>
              Você pode divulgar o MILA como faz com qualquer produto: seu link, suas redes, sua audiência. Funciona — e já paga
              recorrente.
            </p>
            <p>
              Mas existe um caminho diferente. Quem trata o MILA como <strong className="text-white">consultor de produtividade</strong> —
              que entende a dor da empresa, mostra o ganho de organização, acompanha a implantação — não vende uma assinatura.
              Constrói uma <strong className="text-white">carteira de clientes recorrentes</strong>. E carteira, no fim, é patrimônio.
            </p>
            <p>
              É a diferença entre ganhar uma comissão e construir uma renda que paga todo mês, cresce a cada novo cliente e ainda
              rende em dólar quando você atravessa a fronteira.
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
            Empresas e pessoas, no Brasil e no exterior. Quanto mais frentes você dominar, maior a sua carteira.
          </p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Brasil · Empresas</p>
            <p className="mt-2 text-sm text-slate-400">Planos anuais (12x) do Starter ao Enterprise.</p>
            <p className="mt-3 text-2xl font-extrabold text-white">R${PLANS.starter.br!.parcela}–{PLANS.enterprise.br!.parcela}<span className="text-sm font-medium text-slate-400">/mês</span></p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Brasil · Família</p>
            <p className="mt-2 text-sm text-slate-400">Uso pessoal/familiar, plano anual acessível.</p>
            <p className="mt-3 text-2xl font-extrabold text-white">R${PLANS.family.br!.annual}–{PLANS.family_plus.br!.annual}<span className="text-sm font-medium text-slate-400">/ano</span></p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Internacional · Empresas</p>
            <p className="mt-2 text-sm text-slate-400">Assinatura mensal em dólar.</p>
            <p className="mt-3 text-2xl font-extrabold text-white">US${PLANS.starter.usd}–{PLANS.enterprise.usd}<span className="text-sm font-medium text-slate-400">/mês</span></p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Internacional · Família</p>
            <p className="mt-2 text-sm text-slate-400">Uso pessoal, mensal em dólar.</p>
            <p className="mt-3 text-2xl font-extrabold text-white">US${PLANS.family.usd}–{PLANS.family_plus.usd}<span className="text-sm font-medium text-slate-400">/mês</span></p>
          </div>
        </div>
      </section>

      {/* SIMULADOR */}
      <section id="simulador" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Simule agora</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">Quanto a sua carteira paga todo mês?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Comece pelos planos do Brasil, some os internacionais em dólar e veja sua <strong className="text-white">renda recorrente
            mensal</strong> crescer. Brinque com as quantidades — é assim que sua operação se parece.
          </p>
        </div>
        <div className="mt-9">
          <AffiliateSimulator plans={simPlans} fx={USD_BRL} defaults={simDefaults} labels={simLabels} />
        </div>
      </section>

      {/* GRANDE TRIUNFO — 50% vitalício de junho */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-amber-500/[0.06] to-transparent p-8 text-center sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            Somente em junho
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
            50% de comissão. <span className="text-amber-300">Vitalícia.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">
            No mês de lançamento, <strong className="text-amber-200">toda venda fechada em junho rende 50% de comissão para sempre</strong>
            — pela vida inteira daquele cliente. Não é 50% no primeiro mês. É 50% em cada renovação, enquanto ele for cliente.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
            Cada cliente que você fechar agora vale quase o dobro — para sempre. Depois de junho, a comissão volta aos 35%. Os
            clientes de junho continuam pagando 50%. Essa janela não volta.
          </p>
          <a href="#afiliar" className="mt-7 inline-flex items-center justify-center rounded-xl bg-amber-400 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
            Garantir meus 50% vitalícios
          </a>
        </div>
      </section>

      {/* O simulador 50% já está renderizado dentro do componente acima, espelhando as quantidades. */}
      <section className="mx-auto max-w-4xl px-4 pb-4 text-center">
        <p className="text-sm text-slate-400">
          ☝️ Role de volta ao simulador: a tabela dourada <strong className="text-amber-200">já mostra os seus números com 50%</strong>,
          usando exatamente as quantidades que você escolheu.
        </p>
      </section>

      {/* ARSENAL DE APOIO */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Você não vende sozinho</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">O arsenal que vem junto com a sua afiliação</h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Manual da marca + logos">Identidade visual, cores e versões do logo para você criar material com a cara do MILA.</Card>
          <Card title="Tom de voz">Como o MILA fala. Você comunica com consistência e profissionalismo desde o primeiro post.</Card>
          <Card title="Prompts de IA">Prompts prontos para gerar copy, anúncios, roteiros e estratégia de campanha em minutos.</Card>
          <Card title="Páginas de vendas por produto">LPs prontas para empresa e pessoal, Brasil e exterior — é só usar o seu link.</Card>
          <Card title="Demonstração interativa">O cliente testa a captura por voz na hora, direto na página. Sua conversão agradece.</Card>
          <Card title="Atualizações constantes">Produto e materiais evoluem. Você sempre tem novidade para reaquecer a audiência.</Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-3xl font-bold text-white">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {[
            { q: 'Como funciona a comissão recorrente?', a: 'Você recebe 35% sobre cada cobrança do cliente que indicou, enquanto a assinatura estiver ativa. Planos BR são anuais (a comissão acompanha as parcelas e renova a cada ano); planos internacionais são mensais em dólar.' },
            { q: 'O que é a comissão de 50% vitalícia de junho?', a: 'Toda venda fechada durante o mês de junho rende 50% de comissão pela vida inteira daquele cliente — em cada renovação. Após junho, novas vendas voltam a 35%, mas os clientes que você fechou em junho continuam pagando 50% para você.' },
            { q: 'Preciso ser especialista para vender?', a: 'Não. Você pode divulgar como já faz com qualquer produto. Quem quiser ir além, atuando como consultor, tende a construir uma carteira recorrente maior — e damos o material para isso.' },
            { q: 'Como recebo?', a: 'O pagamento e o rastreio das vendas são feitos pela Hotmart, segundo as regras e prazos da plataforma. É só se afiliar com o seu link.' },
            { q: 'Posso vender para fora do Brasil?', a: 'Sim. Há planos internacionais em dólar, para empresas e uso pessoal. Sua comissão sobre essas vendas entra em US$.' },
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
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">Pronto para começar sua carteira recorrente?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Afilie-se agora na Hotmart e garanta os <strong className="text-amber-200">50% vitalícios</strong> em todas as vendas de junho.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={HOTMART_AFFILIATE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-4 text-base font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Quero me afiliar na Hotmart
            </a>
            <a href="#simulador" className="inline-flex items-center justify-center rounded-xl border border-white/15 px-8 py-4 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
              Simular meus ganhos de novo
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Comissões processadas pela Hotmart, conforme regras e prazos da plataforma.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-10 text-xs text-slate-500">
          <p className="text-slate-400">
            Simulações e valores são ilustrativos e não constituem garantia de ganho. Resultados dependem do seu esforço de
            divulgação, das vendas efetivas, de aprovações, reembolsos e renovações, e das regras da Hotmart.
          </p>
          <p>MILA · Programa de Afiliados</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/" className="hover:text-white">Conhecer o MILA</Link>
            <Link href="/privacy" className="hover:text-white">Privacidade</Link>
            <Link href="/security" className="hover:text-white">Segurança</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
