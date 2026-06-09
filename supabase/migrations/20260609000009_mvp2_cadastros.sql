-- ============================================================================
-- APP MILA — Migration 0009: MVP 2 (Cadastros)
--   - people.email (cadastro de pessoa: nome, apelidos, e-mail, pode delegar)
--   - dados cadastrais da holding (Gestão da Holding — corporativo)
--   - regra: em instância CORPORATIVA, só cria demanda quem está em uma equipe
--     (família e admins de qualquer nível sempre podem)
-- Aditiva e idempotente onde possível.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. E-mail da pessoa (opcional; identifica e prepara futura conta de acesso)
-- ----------------------------------------------------------------------------
alter table public.people add column if not exists email text;

-- ----------------------------------------------------------------------------
-- 2. Dados cadastrais da holding (preenchidos na Gestão da Holding)
-- ----------------------------------------------------------------------------
alter table public.holdings add column if not exists legal_name    text;
alter table public.holdings add column if not exists tax_id        text;  -- CNPJ/CPF
alter table public.holdings add column if not exists contact_email text;
alter table public.holdings add column if not exists phone         text;

-- ----------------------------------------------------------------------------
-- 3. Regra de criação de demanda por vínculo de equipe (corporativo)
--    Família: sempre pode. Admin (qualquer nível): sempre pode (liderança).
--    Demais pessoas em corporativo: precisam estar em ao menos uma equipe.
-- ----------------------------------------------------------------------------
create or replace function app.can_create_demands()
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.holdings h
            where h.id = app.current_holding_id() and h.kind = 'family')
    or exists (select 1 from public.memberships m
            where m.person_id = app.current_person_id()
              and m.role in ('team_admin','area_admin','org_admin','holding_admin'))
    or exists (select 1 from public.team_members tm
            where tm.person_id = app.current_person_id());
$$;

grant execute on function app.can_create_demands() to authenticated, anon, service_role;

-- Recria a policy de INSERT de demandas adicionando a regra de equipe.
drop policy if exists demands_insert on public.demands;
create policy demands_insert on public.demands
  for insert with check (
    holding_id = app.current_holding_id()
    and origin_id = app.current_person_id()
    and app.can_create_demands()
    and (
      responsible_id = app.current_person_id()  -- sempre pode criar p/ si
      or (
        (select can_delegate from public.people where id = app.current_person_id())
        and exists (select 1 from public.people p
                    where p.id = responsible_id and p.holding_id = app.current_holding_id())
      )
    )
  );
