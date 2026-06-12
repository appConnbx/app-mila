import { redirect, notFound } from 'next/navigation'
import { cbxMe, hasPerm, CBX_AREAS } from './_lib'

/** Home do portal: vai direto para a primeira área permitida ao operador. */
export default async function CbxHome() {
  const me = await cbxMe()
  if (!me.is_staff) notFound()
  const first = CBX_AREAS.find((a) => hasPerm(me, a.perm))
  if (!first) notFound()
  redirect(first.href)
}
