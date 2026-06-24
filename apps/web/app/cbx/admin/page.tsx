import { SubmitButton } from "@/components/pending";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cbxMe, hasPerm } from "../_lib";
import { PasswordField } from "../_password-field";
import { CbxCard, CbxFlash, Pill, btnCbx, fmtDate, inputCbx, labelCbx, tdCbx, thCbx } from "../_ui";
import { createStaff, setStaff } from "./actions";

type Staff = {
  id: string;
  full_name: string;
  email: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
};
type Audit = {
  id: string;
  actor_name: string;
  action: string;
  target: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const PERMS = ["CEO", "FINANCEIRO", "COMERCIAL", "SUPORTE", "ADMIN"] as const;

const FLASH: Record<string, { ok?: string; err?: string }> = {
  criado: { ok: "Operador criado. Repasse o e-mail e a senha pessoalmente." },
  reaproveitado: {
    ok: "E-mail já tinha conta de acesso — permissões do portal aplicadas (senha não alterada).",
  },
  salvo: { ok: "Operador atualizado." },
  forbidden: { err: "Você não tem permissão de Administração." },
  campos: { err: "Preencha nome, e-mail e ao menos uma permissão." },
  senha: { err: "A senha precisa ter ao menos 6 caracteres." },
  master_untouchable: { err: "O administrador master não pode ser alterado." },
  auth: { err: "Não foi possível criar o acesso. Verifique o e-mail." },
  erro: { err: "Não deu certo. Tente novamente." },
};

export default async function CbxAdminPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const me = await cbxMe();
  if (!me.is_staff || !hasPerm(me, "ADMIN")) notFound();
  const { ok, err } = await searchParams;
  const flash = FLASH[ok ?? err ?? ""] ?? {};

  const supabase = await createClient();
  const sb = supabase as unknown as {
    rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  const [staffRes, auditRes] = await Promise.all([
    sb.rpc("cbx_list_staff"),
    sb.rpc("cbx_list_audit", { p_limit: 50 }),
  ]);
  const staff = (staffRes.data as Staff[] | null) ?? [];
  const audit = (auditRes.data as Audit[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Administração</h1>
        <p className="mt-1 text-sm text-slate-400">
          Equipe que opera o portal. Cada operador entra com e-mail e senha e vê apenas as áreas
          permitidas.
        </p>
      </div>

      <CbxFlash {...flash} />

      {/* Equipe */}
      <CbxCard title="Equipe CONNBX">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={thCbx}>Operador</th>
                <th className={thCbx}>Permissões</th>
                <th className={thCbx}>Status</th>
                <th className={thCbx}>Desde</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-white/5 align-top last:border-0 ${s.is_active ? "" : "opacity-55"}`}
                >
                  <td className={tdCbx}>
                    <p className="font-semibold text-slate-100">{s.full_name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </td>
                  <td className={tdCbx}>
                    {/* Edição inline: marca as permissões e salva */}
                    <form action={setStaff} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={s.is_active ? "1" : "0"} />
                      {PERMS.map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-1 text-[11px] text-slate-300"
                        >
                          <input
                            type="checkbox"
                            name={`perm_${p}`}
                            defaultChecked={s.permissions.includes(p)}
                            className="h-3.5 w-3.5 rounded border-white/20 bg-slate-900 accent-amber-400"
                          />
                          {p}
                        </label>
                      ))}
                      <button
                        type="submit"
                        className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-slate-300 transition hover:bg-white/10"
                      >
                        Salvar
                      </button>
                    </form>
                  </td>
                  <td className={tdCbx}>
                    <Pill tone={s.is_active ? "ok" : undefined}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </Pill>
                  </td>
                  <td className={`${tdCbx} text-slate-400`}>
                    <div className="flex items-center gap-3">
                      {fmtDate(s.created_at)}
                      <form action={setStaff}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="active" value={s.is_active ? "0" : "1"} />
                        {s.permissions.map((p) => (
                          <input key={p} type="hidden" name={`perm_${p}`} value="on" />
                        ))}
                        <button
                          type="submit"
                          className="text-xs text-slate-500 underline-offset-2 transition hover:text-white hover:underline"
                        >
                          {s.is_active ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    Nenhum operador cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CbxCard>

      {/* Novo operador */}
      <CbxCard title="Adicionar operador">
        <form action={createStaff} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cbx-staff-full-name" className={labelCbx}>
              Nome completo
            </label>
            <input
              id="cbx-staff-full-name"
              name="full_name"
              required
              className={`mt-1 ${inputCbx}`}
            />
          </div>
          <div>
            <label htmlFor="cbx-staff-email" className={labelCbx}>
              E-mail
            </label>
            <input
              id="cbx-staff-email"
              name="email"
              type="email"
              required
              className={`mt-1 ${inputCbx}`}
            />
          </div>
          <div>
            <label htmlFor="cbx-staff-password" className={labelCbx}>
              Senha de acesso
            </label>
            <div className="mt-1">
              <PasswordField id="cbx-staff-password" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Anote e repasse pessoalmente. Não enviamos e-mail.
            </p>
          </div>
          <div>
            <span className={labelCbx}>Permissões</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {PERMS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    name={`perm_${p}`}
                    className="h-4 w-4 rounded border-white/20 bg-slate-900 accent-amber-400"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className={btnCbx}>Criar operador</SubmitButton>
          </div>
        </form>
      </CbxCard>

      {/* Auditoria */}
      <CbxCard title="Auditoria (últimas 50 ações)">
        <ul className="space-y-1.5">
          {audit.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-baseline gap-2 rounded-lg bg-slate-900/40 px-3 py-2 text-sm"
            >
              <span className="text-slate-500">{fmtDate(a.created_at)}</span>
              <span className="font-semibold text-slate-200">{a.actor_name}</span>
              <Pill tone="info">{a.action}</Pill>
              {a.target && <span className="text-slate-300">{a.target}</span>}
            </li>
          ))}
          {audit.length === 0 && (
            <li className="text-sm text-slate-500">Nenhuma ação registrada ainda.</li>
          )}
        </ul>
      </CbxCard>
    </div>
  );
}
