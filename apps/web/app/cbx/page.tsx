import { redirect, notFound } from 'next/navigation'
import { cbxMe, hasPerm, CBX_AREAS } from './_lib'

/** Home do portal: vai para a 1ª área permitida; membro sem áreas vê orientação. */
export default async function CbxHome() {
  const me = await cbxMe()
  if (!me.is_staff) notFound()
  const first = CBX_AREAS.find((a) => hasPerm(me, a.perm))
  if (first) redirect(first.href)

  // Membro da equipe CONNBX que ainda não recebeu permissões de área.
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-xl font-bold text-white">Bem-vindo à equipe CONNBX</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Sua conta já tem acesso ao portal, mas ainda não há áreas liberadas para você. Peça a um administrador para atribuir
        suas permissões (CEO, Financeiro, Comercial, Suporte ou Administração) em <span className="text-slate-300">Administração</span>.
      </p>
    </div>
  )
}
