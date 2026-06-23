import type { Database } from "@mila/supabase";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role key — IGNORA RLS.
 * Uso EXCLUSIVO no servidor (webhook da Hotmart, provisionamento). Nunca exponha
 * a service_role ao cliente. Lança erro se a env var não estiver configurada.
 */
let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente — configure no ambiente (Vercel/.env.local).",
    );
  }
  if (!cached) {
    cached = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
