'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const BASE = '/start-family-free'

function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  return d2 === parseInt(cpf[10])
}

type RpcResult = { ok: boolean; reason?: string; holding_id?: string }

/**
 * Cadastro gratuito (Family Free) com auto-login: ao concluir, já entra na conta
 * e vai para o app — sem passar pela tela de login. Documento (PII) fica restrito
 * ao back-office (CBX) e nunca aparece no produto do cliente.
 */
export async function signupFamilyFree(formData: FormData) {
  if (String(formData.get('website') ?? '') !== '') redirect(`${BASE}?err=generico`)

  // Rate-limit por IP: cadastro grátis cria conta + auto-login (caro/abusável).
  if (rateLimit(`signup-family:${await clientIp()}`, { windowMs: 600_000, max: 5 })) {
    redirect(`${BASE}?err=muitas`)
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const country = String(formData.get('country') ?? 'Brasil').trim()
  const documentRaw = String(formData.get('document') ?? '').trim()

  if (!name || !email || !documentRaw) redirect(`${BASE}?err=campos`)
  if (password.length < 6) redirect(`${BASE}?err=senha`)
  if (password !== confirm) redirect(`${BASE}?err=confirm`)
  if (country === 'Brasil' && !isValidCPF(documentRaw)) redirect(`${BASE}?err=cpf`)

  const document = country === 'Brasil' ? documentRaw.replace(/\D/g, '') : documentRaw

  const admin = createAdminClient()
  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  const uid = created?.user?.id ?? null
  if (error && !uid) redirect(`${BASE}?err=email_existe`)
  if (!uid) redirect(`${BASE}?err=generico`)

  const sbAdmin = admin as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: RpcResult | null }>
  }
  const { data } = await sbAdmin.rpc('provision_family_free', {
    p_name: name, p_email: email, p_auth_user_id: uid, p_document: document, p_country: country,
  })
  if (!data?.ok) {
    await admin.auth.admin.deleteUser(uid).catch(() => undefined)
    redirect(`${BASE}?err=${data?.reason === 'document_exists' ? 'doc_existe' : 'generico'}`)
  }

  // Auto-login: cria a sessão (cookies) e leva direto para o app.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) redirect('/login?error=' + encodeURIComponent(signInErr.message))
  const sb = supabase as unknown as { rpc: (n: string) => Promise<unknown> }
  await sb.rpc('start_session')
  redirect('/dashboard')
}
