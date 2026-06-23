import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Acesso temporário de suporte (ghost): o logout revoga o acesso na hora e
  // apaga a conta de acesso — para voltar, o especialista gera um novo.
  let ghostUid: string | null = null;
  try {
    const sb = supabase as unknown as {
      rpc: (n: string) => Promise<{ data: { is_ghost: boolean } | null }>;
    };
    const { data } = await sb.rpc("support_signout_cleanup");
    if (data?.is_ghost) {
      const { data: userData } = await supabase.auth.getUser();
      ghostUid = userData.user?.id ?? null;
    }
  } catch {
    /* nunca bloqueia o logout */
  }

  await supabase.auth.signOut();

  if (ghostUid) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(ghostUid);
    } catch {
      /* já revogado no banco; o touch_activity derruba qualquer sessão restante */
    }
  }

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
