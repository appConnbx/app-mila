import { SubmitButton } from "@/components/pending";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cbxMe, hasPerm } from "../../_lib";
import { PasswordField } from "../../_password-field";
import {
  CbxCard,
  CbxFlash,
  Pill,
  btnCbx,
  fmtDate,
  inputCbx,
  labelCbx,
  tdCbx,
  thCbx,
} from "../../_ui";
import { createSupportAccess, revokeSupportAccess } from "../actions";

type Access = {
  id: string;
  holding_id: string;
  client_name: string;
  ghost_email: string;
  created_by_name: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  is_valid: boolean;
};
type ClientOpt = { holding_id: string; name: string };

const FLASH: Record<string, { ok?: string; err?: string }> = {
  criado: {
    ok: "Acesso gerado. Use o e-mail abaixo + a senha definida para entrar em www.appmila.co/login.",
  },
  revogado: { ok: "Acesso revogado e conta de acesso apagada." },
  forbidden: { err: "Você não tem permissão de Suporte." },
  campos: { err: "Escolha o cliente." },
  senha: { err: "A senha precisa ter ao menos 6 caracteres." },
  auth: { err: "Não foi possível criar a conta de acesso." },
  no_organization: { err: "Este cliente não tem organização criada." },
  erro: { err: "Não deu certo. Tente novamente." },
};

export default async function AcessosPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const me = await cbxMe();
  if (!me.is_staff || !hasPerm(me, "SUPORTE")) notFound();
  const { ok, err } = await searchParams;
  const flash = FLASH[ok ?? err ?? ""] ?? {};

  const supabase = await createClient();
  const sb = supabase as unknown as {
    rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  const [accessRes, clientsRes] = await Promise.all([
    sb.rpc("cbx_list_support_access"),
    sb.rpc("cbx_list_clients"),
  ]);
  const accesses = (accessRes.data as Access[] | null) ?? [];
  const clients = ((clientsRes.data as ClientOpt[] | null) ?? []).map((c) => ({
    holding_id: c.holding_id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/cbx/suporte" className="text-sm text-slate-500 hover:text-white">
          ← Suporte
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Acessos temporários</h1>
        <p className="mt-1 text-sm text-slate-400">
          Acesso assistido dentro da instância do cliente.{" "}
          <b className="text-slate-200">Invisível para o cliente</b> (não aparece em usuários,
          organograma ou equipes), não consome licença, expira sozinho e morre no logout.
        </p>
      </div>

      <CbxFlash {...flash} />

      {/* Gerar acesso */}
      <CbxCard title="Gerar acesso">
        <form action={createSupportAccess} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="cbx-access-holding-id" className={labelCbx}>
              Cliente
            </label>
            <select
              id="cbx-access-holding-id"
              name="holding_id"
              required
              defaultValue=""
              className={`mt-1 ${inputCbx}`}
            >
              <option value="" disabled>
                Escolha o cliente
              </option>
              {clients.map((c) => (
                <option key={c.holding_id} value={c.holding_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cbx-access-hours" className={labelCbx}>
              Validade (horas)
            </label>
            <input
              id="cbx-access-hours"
              name="hours"
              type="number"
              min={1}
              max={24}
              defaultValue={4}
              className={`mt-1 ${inputCbx}`}
            />
          </div>
          <div>
            <label htmlFor="cbx-access-password" className={labelCbx}>
              Senha do acesso
            </label>
            <div className="mt-1">
              <PasswordField id="cbx-access-password" />
            </div>
          </div>
          <div className="sm:col-span-3">
            <SubmitButton className={btnCbx}>Gerar acesso temporário</SubmitButton>
            <p className="mt-2 text-xs text-slate-500">
              O e-mail de login aparece na lista abaixo após gerar. Entre em www.appmila.co/login
              com ele + a senha. Ao sair (logout), o acesso é revogado na hora; para voltar, gere um
              novo.
            </p>
          </div>
        </form>
      </CbxCard>

      {/* Lista */}
      <CbxCard title="Histórico de acessos">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={thCbx}>Cliente</th>
                <th className={thCbx}>E-mail de login</th>
                <th className={thCbx}>Gerado por</th>
                <th className={thCbx}>Expira</th>
                <th className={thCbx}>Status</th>
                <th className={thCbx}></th>
              </tr>
            </thead>
            <tbody>
              {accesses.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b border-white/5 last:border-0 ${a.is_valid ? "" : "opacity-55"}`}
                >
                  <td className={`${tdCbx} font-semibold text-slate-100`}>{a.client_name}</td>
                  <td className={tdCbx}>
                    <code className="rounded bg-slate-900/70 px-2 py-0.5 text-xs text-amber-300">
                      {a.ghost_email}
                    </code>
                  </td>
                  <td className={`${tdCbx} text-slate-300`}>{a.created_by_name}</td>
                  <td className={`${tdCbx} text-slate-400`}>{fmtDate(a.expires_at)}</td>
                  <td className={tdCbx}>
                    <Pill tone={a.is_valid ? "ok" : undefined}>
                      {a.is_valid ? "Válido" : a.revoked_at ? "Revogado" : "Expirado"}
                    </Pill>
                  </td>
                  <td className={tdCbx}>
                    {a.is_valid && (
                      <form action={revokeSupportAccess}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="text-xs text-rose-300 underline-offset-2 transition hover:underline"
                        >
                          Revogar agora
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {accesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum acesso gerado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CbxCard>
    </div>
  );
}
