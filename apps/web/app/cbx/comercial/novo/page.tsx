import { SubmitButton } from "@/components/pending";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cbxMe, hasPerm } from "../../_lib";
import { CbxCard, CbxFlash, btnCbx, inputCbx, labelCbx } from "../../_ui";
import { createClientAccount } from "../actions";

type Plan = {
  id: string;
  name: string;
  account_kind: "corporate" | "family";
  provider: string;
  max_users: number | null;
};

const FLASH: Record<string, { ok?: string; err?: string }> = {
  forbidden: { err: "Você não tem permissão Comercial." },
  campos: { err: "Preencha nome do cliente, plano e e-mail do administrador." },
  senha: { err: "A senha precisa ter ao menos 6 caracteres." },
  auth: { err: "Não foi possível criar o acesso do administrador." },
  plan_kind_mismatch: {
    err: "O plano escolhido não é do mesmo tipo (corporativo/família) da conta.",
  },
  plan_not_found: { err: "Plano inválido." },
  erro: { err: "Não deu certo. Tente novamente." },
};

export default async function NovoClientePage({
  searchParams,
}: { searchParams: Promise<{ err?: string }> }) {
  const me = await cbxMe();
  if (!me.is_staff || !hasPerm(me, "COMERCIAL")) notFound();
  const { err } = await searchParams;
  const flash = FLASH[err ?? ""] ?? {};

  const supabase = await createClient();
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: Plan[] | null }> };
  const { data } = await sb.rpc("admin_list_plans");
  const plans = data ?? [];

  const label = (p: Plan) =>
    `${p.name} · ${p.account_kind === "family" ? "Família" : "Corporativo"} ${p.max_users == null ? "(∞)" : `(${p.max_users})`} · ${p.provider}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Novo cliente (manual)</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cria a instância completa sem passar pela Hotmart: conta, usuário administrador e licença.
          É aqui que se atribui o <b className="text-amber-300">VIP CONNBX</b>.
        </p>
      </div>

      <CbxFlash {...flash} />

      <CbxCard>
        <form action={createClientAccount} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCbx}>Nome do cliente / conta</label>
              <input
                name="name"
                required
                className={`mt-1 ${inputCbx}`}
                placeholder="Ex.: Grupo Exemplo"
              />
            </div>
            <div>
              <label className={labelCbx}>Tipo</label>
              <select name="kind" className={`mt-1 ${inputCbx}`} defaultValue="corporate">
                <option value="corporate">Corporativo</option>
                <option value="family">Família</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCbx}>Plano / licença</label>
              <select name="plan_id" required defaultValue="" className={`mt-1 ${inputCbx}`}>
                <option value="" disabled>
                  Escolha o plano
                </option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {label(p)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCbx}>Limite personalizado (opcional)</label>
              <input
                name="seats"
                type="number"
                min={1}
                placeholder="—"
                className={`mt-1 ${inputCbx}`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Em branco = limite do plano. VIP CONNBX é sempre ilimitado.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-3 text-sm font-semibold text-slate-200">Administrador da conta</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCbx}>Nome</label>
                <input name="admin_name" className={`mt-1 ${inputCbx}`} />
              </div>
              <div>
                <label className={labelCbx}>E-mail (login)</label>
                <input name="admin_email" type="email" required className={`mt-1 ${inputCbx}`} />
              </div>
              <div className="sm:col-span-2">
                <p className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
                  O cliente recebe um <b>e-mail para criar a senha</b> e concluir o acesso — não
                  defina senha aqui. Se o e-mail já tiver conta, ela é reaproveitada.
                </p>
              </div>
            </div>
          </div>

          <SubmitButton className={btnCbx}>Criar cliente</SubmitButton>
        </form>
      </CbxCard>
    </div>
  );
}
