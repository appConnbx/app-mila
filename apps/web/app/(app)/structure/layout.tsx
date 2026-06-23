import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Toda a área de Estrutura é restrita ao ADMINISTRADOR DA HOLDING (admin do
 * sistema). Usuários comuns são redirecionados para as Demandas.
 */
export default async function EstruturaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> };
  const { data: isAdmin } = await sb.rpc("is_holding_admin");
  if (!isAdmin) redirect("/tasks");
  return <>{children}</>;
}
