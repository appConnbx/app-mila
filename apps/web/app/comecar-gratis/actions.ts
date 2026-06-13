'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

/** Valida CPF (formato + dígitos verificadores). */
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
 * Cadastro gratuito (Family Free) — self-service na landing.
 * Coleta documento de identificação (CPF no Brasil, doc oficial nos demais).
 * O documento é dado pessoal: fica restrito ao back-office (CBX) e nunca é
 * exibido no produto do cliente.
 */
export async function signupFamilyFree(formData: FormData) {
  // Honeypot anti-bot: campo oculto que humanos não preenchem.
  if (String(formData.get('website') ?? '') !== '') redirect('/comecar-gratis?err=erro')

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const country = String(formData.get('country') ?? 'Brasil').trim()
  const documentRaw = String(formData.get('document') ?? '').trim()

  if (!name || !email || !documentRaw) redirect('/comecar-gratis?err=campos')
  if (password.length < 6) redirect('/comecar-gratis?err=senha')
  if (country === 'Brasil' && !isValidCPF(documentRaw)) redirect('/comecar-gratis?err=cpf')

  const document = country === 'Brasil' ? documentRaw.replace(/\D/g, '') : documentRaw

  const admin = createAdminClient()
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  let uid = created?.user?.id ?? null
  if (error && !uid) {
    // E-mail já tem conta → não recriamos nem trocamos senha; orientamos login.
    redirect('/comecar-gratis?err=email_existe')
  }
  if (!uid) redirect('/comecar-gratis?err=erro')

  const sb = admin as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: RpcResult | null }>
  }
  const { data } = await sb.rpc('provision_family_free', {
    p_name: name,
    p_email: email,
    p_auth_user_id: uid,
    p_document: document,
    p_country: country,
  })

  if (!data?.ok) {
    // Desfaz o auth órfão se o provisionamento falhar (ex.: documento já usado).
    await admin.auth.admin.deleteUser(uid).catch(() => undefined)
    redirect(`/comecar-gratis?err=${data?.reason ?? 'erro'}`)
  }

  redirect('/comecar-gratis?ok=1')
}
