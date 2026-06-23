import type { Database } from "@mila/supabase";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente Supabase para Server Components / Server Actions / Route Handlers.
 * Lê e grava a sessão nos cookies da requisição.
 */
export const ACTIVE_HOLDING_COOKIE = "mila_holding";

export async function createClient() {
  const cookieStore = await cookies();
  // Instância ativa escolhida pelo usuário — enviada ao banco como x-holding-id,
  // onde o RLS valida o vínculo e escopa todas as consultas.
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value;

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: holdingId ? { headers: { "x-holding-id": holdingId } } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // chamado de um Server Component: ignorar — o middleware renova a sessão.
          }
        },
      },
    },
  );
}
