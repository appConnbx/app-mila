"use client";

import type { Database } from "@mila/supabase";
import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para componentes de cliente (browser). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
