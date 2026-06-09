-- ============================================================================
-- APP MILA — Migration 0005: Multi-vertical + identidade entre instâncias + super-admin
--   - Conta tem tipo: corporate | family (mesmo motor, regras distintas)
--   - Um mesmo login (auth_user_id) pode ter vínculo em VÁRIAS instâncias
--     (várias holdings e/ou famílias) e alternar a "instância ativa"
--   - platform_admins = equipe CONNBX (dona do produto), com acesso de suporte
-- Aditiva: redefine funções de contexto/escopo via CREATE OR REPLACE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tipo de conta
-- ----------------------------------------------------------------------------
create type app.account_kind as enum ('corporate','family');

alter table public.holdings
  add column kind app.account_kind not null default 'corporate';

-- ----------------------------------------------------------------------------
-- 2. Identidade entre instâncias
--    Antes: auth_user_id era único globalmente (1 login = 1 holding).
--    Agora: único POR holding (1 login = N holdings/famílias).
-- ----------------------------------------------------------------------------
alter table public.people drop constraint people_auth_user_id_key;
alter table public.people add constraint people_holding_auth_unique unique (holding_id, auth_user_id);

-- ----------------------------------------------------------------------------
-- 3. Super-admin da plataforma (CONNBX)
-- ----------------------------------------------------------------------------
create table public.platform_admins (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users(id) on delete cascade,
  full_name     text,
  created_at    timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
-- Cada super-admin vê o próprio registro; gestão da lista é via service_role.
create policy platform_admins_self on public.platform_admins
  for select using (auth_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. Funções de contexto — instância ativa por requisição
--    O app envia o header 'x-holding-id'. O banco SEMPRE valida o vínculo.
-- ----------------------------------------------------------------------------

-- É super-admin da plataforma?
create or replace function app.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where auth_user_id = auth.uid());
$$;

-- Holding pedida no header da requisição (ou null).
create or replace function app.requested_holding_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.headers', true)::json ->> 'x-holding-id', '')::uuid;
$$;

-- Instância ativa, validada:
--   - super-admin pode assumir QUALQUER holding (suporte/impersonação);
--   - usuário comum só "entra" onde tem vínculo;
--   - sem header: usa a primeira holding do usuário (caso instância única).
create or replace function app.current_holding_id()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  req uuid := app.requested_holding_id();
begin
  if req is null then
    return (select holding_id from public.people where auth_user_id = auth.uid() limit 1);
  end if;
  if app.is_platform_admin() then
    return req;
  end if;
  if exists (select 1 from public.people where auth_user_id = auth.uid() and holding_id = req) then
    return req;
  end if;
  return null;
end;
$$;

-- Pessoa do usuário NA instância ativa.
create or replace function app.current_person_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.people
  where auth_user_id = auth.uid() and holding_id = app.current_holding_id()
  limit 1;
$$;

-- Papel por escopo — super-admin conta como tendo o papel (acesso de suporte).
create or replace function app.has_role(_role app.member_role, _scope uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_platform_admin()
      or exists (
        select 1 from public.memberships m
        where m.person_id = app.current_person_id()
          and m.role = _role
          and m.scope_id = _scope
      );
$$;

-- Supervisão — super-admin enxerga qualquer pessoa da instância assumida.
create or replace function app.can_oversee(_target_person uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_platform_admin()
      or exists (
        select 1
        from public.memberships m
        join public.people tp on tp.id = _target_person
        where m.person_id = app.current_person_id()
          and (
                (m.role = 'holding_admin' and m.scope_id = tp.holding_id)
             or (m.role = 'org_admin'     and m.scope_id = tp.organization_id)
             or (m.role = 'area_admin'    and m.scope_id in (
                   select t.area_id from public.team_members tm
                   join public.teams t on t.id = tm.team_id
                   where tm.person_id = tp.id))
             or (m.role = 'team_admin'    and m.scope_id in (
                   select tm.team_id from public.team_members tm
                   where tm.person_id = tp.id))
              )
      );
$$;

-- Regarantir execute para os papéis do Supabase (funções novas/recriadas).
grant execute on all functions in schema app to authenticated, anon, service_role;
