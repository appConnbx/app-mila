import Link from 'next/link'
import type { Metadata } from 'next'
import { SignupForm } from './_form'

export const metadata: Metadata = {
  title: 'Comece grátis · MILA',
  description: 'Crie sua conta gratuita do MILA: 1 usuário e até 15 demandas por dia.',
}

const FLASH: Record<string, { ok?: string; err?: string }> = {
  campos: { err: 'Preencha nome, e-mail e documento.' },
  senha: { err: 'A senha precisa ter ao menos 6 caracteres.' },
  cpf: { err: 'CPF inválido. Confira os números.' },
  email_existe: { err: 'Já existe uma conta com este e-mail. Faça login.' },
  document_exists: { err: 'Já existe uma conta gratuita com este documento.' },
  erro: { err: 'Não foi possível concluir o cadastro. Tente novamente.' },
}

export default async function ComecarGratisPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams
  const flash = ok ? { ok: 'Conta criada! Já pode entrar.' } : FLASH[err ?? ''] ?? {}

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">MILA</span>
            <span className="h-4 w-1 rounded-full bg-cyan-400" />
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-white">Comece grátis</h1>
          <p className="mt-1 text-sm text-slate-400">
            Para famílias: organize tudo num lugar só. 1 usuário, até 15 demandas por dia.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {ok ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</div>
              <p className="text-sm text-emerald-300">{flash.ok}</p>
              <Link href="/login" className="inline-block w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                Entrar agora
              </Link>
            </div>
          ) : (
            <>
              {flash.err && (
                <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {flash.err}
                  {err === 'email_existe' && (
                    <> <Link href="/login" className="font-semibold underline">Ir para login</Link>.</>
                  )}
                </div>
              )}
              <SignupForm />
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Precisa de mais? <Link href="/#planos" className="text-cyan-400 hover:underline">Veja os planos pagos</Link>
        </p>
      </div>
    </main>
  )
}
