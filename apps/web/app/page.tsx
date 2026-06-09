import type { Metadata } from 'next'
import Link from 'next/link'
import { startNow } from './_actions'

export const metadata: Metadata = {
  title: 'MILA — Nunca mais perca uma demanda',
  description:
    'O MILA transforma conversas, reuniões e decisões em execução organizada — no trabalho e em casa. Capture, delegue, acompanhe e conclua. Tudo em uma só conta.',
  openGraph: {
    title: 'MILA — Nunca mais perca uma demanda',
    description:
      'Capture, delegue, acompanhe e conclua. Suas demandas do trabalho e as pessoais, na mesma conta.',
    url: 'https://www.appmila.co',
    siteName: 'MILA',
    locale: 'pt_BR',
    type: 'website',
  },
}

/* ---------- Ícones (inline, leves) ---------- */
function Check({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- Marca ---------- */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
      <span className="text-lg font-bold tracking-tight text-white">MILA</span>
    </Link>
  )
}

/* ---------- Mockup do dashboard (hero) ---------- */
function DashboardMockup() {
  const bars = [40, 62, 48, 75, 55, 88, 70, 96, 64, 82, 58, 90]
  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0C1424]/90 p-3 shadow-2xl ring-1 ring-white/5 backdrop-blur sm:p-4">
      {/* topo */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-black text-slate-950">M</span>
          <span className="text-sm font-semibold text-white">Demandas · Esta semana</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">no prazo</span>
      </div>

      {/* KPIs */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          { l: 'Abertas', v: '23', c: 'text-white' },
          { l: 'Em andamento', v: '11', c: 'text-amber-300' },
          { l: 'Atrasadas', v: '02', c: 'text-rose-300' },
          { l: 'Concluídas', v: '47', c: 'text-emerald-300' },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
            <p className="text-[10px] text-slate-400">{k.l}</p>
            <p className={`mt-0.5 text-xl font-bold ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* gráfico */}
      <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-300">Conclusões por dia</p>
          <p className="text-[11px] text-slate-500">+18% vs. semana anterior</p>
        </div>
        <div className="mt-3 flex h-24 items-end gap-1.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-brand-700/40 to-brand"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* linha de demanda */}
      <div className="mt-3 space-y-1.5">
        {[
          { t: 'Enviar proposta ao cliente', who: 'Você → Marina', s: 'Trabalho' },
          { t: 'Levar o carro na revisão', who: 'Pessoal', s: 'Família' },
        ].map((d) => (
          <div key={d.t} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-100">{d.t}</p>
              <p className="text-[10px] text-slate-500">{d.who}</p>
            </div>
            <span className="ml-2 shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">{d.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===================================================================== */

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-slate-200">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#como" className="transition hover:text-white">Como funciona</a>
            <a href="#contextos" className="transition hover:text-white">Empresas & Famílias</a>
            <a href="#planos" className="transition hover:text-white">Planos</a>
            <a href="#afiliados" className="transition hover:text-white">Indique e Ganhe</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white">
              Entrar
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
            >
              Começar agora
            </Link>
          </div>
        </nav>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative">
        {/* glows */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
          <div className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-orange-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-16 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Trabalho e vida pessoal, na mesma conta
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Nunca mais perca uma demanda{' '}
              <span className="bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">
                por falta de anotação
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              O MILA transforma conversas, reuniões e decisões em execução organizada. Capture na hora, delegue para quem
              é responsável e acompanhe até concluir — na empresa e em casa.
            </p>

            {/* CTA */}
            <form action={startNow} className="mt-7 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                name="email"
                placeholder="Seu melhor e-mail"
                aria-label="E-mail"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
              >
                Começar agora <Arrow className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Comece em minutos · Planos para empresas e famílias · Cancele quando quiser
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/10 via-transparent to-orange-500/10 blur-2xl" />
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ---------------- GATILHOS (dor → resultado) ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10">
          <h2 className="max-w-2xl text-2xl font-bold text-white sm:text-3xl">
            Quantas demandas você já perdeu esta semana?
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Tudo que é combinado na correria e não vira tarefa, simplesmente some. O custo não é só o esquecimento — é o
            retrabalho, a cobrança e a confiança que se perde.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                p: '“Achei que alguém ia resolver.”',
                r: 'Toda demanda tem um responsável claro. Nada fica no ar.',
              },
              {
                p: '“Esqueci de anotar e passou.”',
                r: 'Capture em segundos, por texto ou voz. O que entra, não some.',
              },
              {
                p: '“Não sei o que a equipe está fazendo.”',
                r: 'Acompanhe o andamento em tempo real, por pessoa, equipe e área.',
              },
            ].map((b) => (
              <div key={b.p} className="rounded-xl border border-white/5 bg-surface-card p-5">
                <p className="text-sm font-medium text-slate-400">{b.p}</p>
                <div className="mt-3 flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <p className="text-sm font-medium text-slate-100">{b.r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <section id="como" className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Simples assim</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Da conversa à conclusão, em 4 passos</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: '01', t: 'Capture', d: 'Anote a demanda na hora — por texto ou comando de voz. Avulsa ou dentro de um evento.' },
            { n: '02', t: 'Delegue', d: 'Defina o responsável, prazo e prioridade. Para você ou para alguém da equipe.' },
            { n: '03', t: 'Acompanhe', d: 'Veja o status de tudo em painéis por pessoa, equipe, área e organização.' },
            { n: '04', t: 'Conclua', d: 'Registre o que foi feito. O histórico fica salvo e vira indicador de produtividade.' },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/5 bg-surface-card p-6">
              <span className="text-sm font-bold text-brand">{s.n}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- DOIS CONTEXTOS ---------------- */}
      <section id="contextos" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Uma conta. Dois mundos, sem misturar.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Veja suas demandas do trabalho dentro da organização e suas demandas pessoais da família — no mesmo login,
            com um clique para alternar entre eles.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Corporativo */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-card p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">Para empresas</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Produtividade que a liderança enxerga</h3>
            <p className="mt-3 text-slate-400">
              Estruture a empresa como ela é — Organização, Áreas e Equipes — e dê a cada gestor a visão do que está
              acontecendo. Delegue com clareza e acompanhe resultados, não promessas.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                'Estrutura por organização, área e equipe',
                'Delegação com responsável, prazo e prioridade',
                'Painéis de acompanhamento por escopo',
                'Eventos (reuniões/follow-ups) que capturam demandas',
                'Indicadores de produtividade e destaque de talentos',
              ].map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {i}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-300">
              Resultado: <span className="font-semibold text-white">menos retrabalho, prazos cumpridos</span> e uma
              equipe que sabe exatamente o que fazer.
            </p>
          </div>

          {/* Família */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-card p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-300">Para famílias</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Combinados claros, casa em harmonia</h3>
            <p className="mt-3 text-slate-400">
              Sem burocracia: cadastre as pessoas da família e organize o que precisa ser feito. Cada um sabe sua parte,
              e o que foi combinado deixa de virar discussão.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                'Cadastro simples de pessoas — sem estrutura corporativa',
                'Demandas pessoais e da casa em um só lugar',
                'Quem faz o quê, com prazo e lembrete',
                'Comunicação clara entre todos',
                'Até 5 pessoas, por um preço acessível',
              ].map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /> {i}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-300">
              Resultado: <span className="font-semibold text-white">nada esquecido, ninguém sobrecarregado</span> e mais
              tranquilidade no dia a dia.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- PLANOS ---------------- */}
      <section id="planos" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Planos</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Escolha como o MILA se aplica a você</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Comece pelo que faz sentido hoje. Você pode ter um plano de empresa e um de família na mesma conta.
          </p>
        </div>

        {/* Corporativo */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-white">Corporativo</h3>
          <p className="text-sm text-slate-400">Para times e empresas que querem previsibilidade na execução.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {[
              { name: 'Time', users: 'até 10 usuários', price: '200', tag: 'Para começar com o time' },
              { name: 'Crescimento', users: 'até 20 usuários', price: '300', tag: 'O mais escolhido', featured: true },
              { name: 'Escala', users: 'até 100 usuários', price: '1.000', tag: 'Para operações maiores' },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-6 ${
                  p.featured
                    ? 'border-brand/40 bg-gradient-to-b from-brand/[0.08] to-surface-card'
                    : 'border-white/10 bg-surface-card'
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-[11px] font-bold text-slate-950">
                    {p.tag}
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-400">{p.users}</p>
                <p className="mt-4 text-4xl font-extrabold text-white">
                  R${p.price}
                  <span className="text-base font-medium text-slate-400">/mês</span>
                </p>
                {!p.featured && <p className="mt-1 text-xs text-slate-500">{p.tag}</p>}
                <Link
                  href="/login"
                  className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.featured
                      ? 'bg-brand text-slate-950 hover:bg-brand-500'
                      : 'border border-white/10 text-slate-200 hover:bg-white/5'
                  }`}
                >
                  Começar
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Acima de 100 usuários: <span className="font-medium text-slate-300">+R$5 por usuário adicional</span>.
          </p>
        </div>

        {/* Família */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-white">Família</h3>
          <p className="text-sm text-slate-400">Simples e acessível. Pague pelo número de pessoas — até 5.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-b from-orange-500/[0.08] to-surface-card p-6 lg:col-span-2">
              <p className="text-sm font-semibold text-white">Plano Família</p>
              <p className="text-xs text-slate-400">Escolha quantas pessoas vão participar.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { u: '1', v: '20' },
                  { u: '2', v: '30' },
                  { u: '3', v: '40' },
                  { u: '4', v: '50' },
                  { u: '5', v: '55' },
                ].map((f) => (
                  <div key={f.u} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <p className="text-xs text-slate-400">{f.u} {f.u === '1' ? 'pessoa' : 'pessoas'}</p>
                    <p className="mt-1 text-xl font-bold text-white">R${f.v}</p>
                    <p className="text-[10px] text-slate-500">/mês</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-surface-card p-6">
              <p className="text-sm text-slate-300">Tudo o que a família precisa para se organizar, sem complicar.</p>
              <Link
                href="/login"
                className="mt-4 block rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                Começar com a família
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- INDIQUE E GANHE ---------------- */}
      <section id="afiliados" className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-brand/[0.10] via-surface-card to-orange-500/[0.10] p-8 sm:p-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                Programa de Afiliados
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white">Indique o MILA e ganhe</h2>
              <p className="mt-3 max-w-xl text-slate-400">
                Conhece empresas e famílias que vivem perdendo demandas? Indique o MILA e seja recompensado a cada nova
                assinatura ativada pela sua indicação.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <Link
                href="/affiliates"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Quero indicar <Arrow className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-center text-xs text-slate-500 lg:text-right">Programa em breve</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 bg-surface-card p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            A próxima demanda, você não esquece.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Coloque tudo no lugar — no trabalho e em casa. Comece a usar o MILA hoje.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
            >
              Começar agora <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Transforma demandas soltas, reuniões e decisões em execução organizada.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
            <a href="#como" className="transition hover:text-white">Como funciona</a>
            <a href="#planos" className="transition hover:text-white">Planos</a>
            <a href="#afiliados" className="transition hover:text-white">Indique e Ganhe</a>
            <Link href="/login" className="transition hover:text-white">Entrar</Link>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MILA. Todos os direitos reservados.</p>
            <p>Português (BR) · English · Español — em breve</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
