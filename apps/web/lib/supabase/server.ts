import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@mila/supabase'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/**
 * Cliente Supabase para Server Components / Server Actions / Route Handlers.
 * Lê e grava a sessão nos cookies da requisição.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // chamado de um Server Component: ignorar — o middleware renova a sessão.
          }
        },
      },
    }
  )
}
