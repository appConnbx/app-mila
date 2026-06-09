-- ============================================================================
-- APP MILA — Migration 0002: Funções auxiliares e gatilhos (triggers)
-- Regras de negócio reforçadas no banco:
--   - updated_at automático
--   - derivação de holding/organização da demanda a partir do responsável
--   - vínculo automático da demanda à sessão de evento aberta (origem)
--   - histórico automático de mudanças da demanda + completed_at
-- As funções de contexto/escopo (SECURITY DEFINER) alimentam o RLS sem recursão.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONTEXTO: quem é o usuário atual e a qual holding pertence.
-- SECURITY DEFINER + leitura direta de people evitam recursão no RLS.
-- ----------------------------------------------------------------------------
create or replace function app.current_person_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.people where auth_user_id = auth.uid() limit 1;
$$;

create or replace function app.current_holding_id()
returns uuid language sql stable security definer set search_path = public as $$
  select holding_id from public.people where auth_user_id = auth.uid() limit 1;
$$;

-- Existe um membership com este papel para este escopo (para o usuário atual)?
create or replace function app.has_role(_role app.member_role, _scope uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.person_id = app.current_person_id()
      and m.role = _role
      and m.scope_id = _scope
  );
$$;

-- O usuário atual tem permissão de acompanhar (oversee) a pessoa-alvo?
-- Cobre holding_admin / org_admin / area_admin / team_admin pelo vínculo do alvo.
create or replace function app.can_oversee(_target_person uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
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

-- O usuário atual pode ver esta demanda? (responsável, origem ou supervisão)
create or replace function app.can_see_demand(_demand uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.demands d
    where d.id = _demand
      and d.holding_id = app.current_holding_id()
      and (
            d.responsible_id = app.current_person_id()
         or d.origin_id      = app.current_person_id()
         or app.can_oversee(d.responsible_id)
          )
  );
$$;

-- O usuário atual pode ver este evento? (dono, participante ou supervisão)
create or replace function app.can_see_event(_event uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events e
    where e.id = _event
      and e.holding_id = app.current_holding_id()
      and (
            e.owner_id = app.current_person_id()
         or app.can_oversee(e.owner_id)
         or exists (select 1 from public.event_participants ep
                    where ep.event_id = e.id and ep.person_id = app.current_person_id())
          )
  );
$$;

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_holdings_updated      before update on public.holdings      for each row execute function app.set_updated_at();
create trigger trg_organizations_updated before update on public.organizations for each row execute function app.set_updated_at();
create trigger trg_areas_updated         before update on public.areas         for each row execute function app.set_updated_at();
create trigger trg_teams_updated         before update on public.teams         for each row execute function app.set_updated_at();
create trigger trg_people_updated        before update on public.people        for each row execute function app.set_updated_at();
create trigger trg_events_updated        before update on public.events        for each row execute function app.set_updated_at();
create trigger trg_demands_updated       before update on public.demands       for each row execute function app.set_updated_at();

-- ----------------------------------------------------------------------------
-- DEMANDA — antes de inserir:
--   - deriva holding_id/organization_id do responsável (se não vierem)
--   - vincula à sessão de evento aberta da ORIGEM (quem está criando), se houver
--   - marca completed_at quando já nasce finalizada
-- ----------------------------------------------------------------------------
create or replace function app.before_demand_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  resp record;
begin
  select holding_id, organization_id into resp from public.people where id = new.responsible_id;

  if new.holding_id is null then
    new.holding_id := resp.holding_id;
  end if;
  if new.organization_id is null then
    new.organization_id := resp.organization_id;
  end if;

  if new.event_id is null then
    select active_event_id into new.event_id from public.people where id = new.origin_id;
  end if;

  if new.status = 'finalizada' and new.completed_at is null then
    new.completed_at := now();
  end if;

  return new;
end;
$$;

create trigger trg_demands_before_insert
  before insert on public.demands
  for each row execute function app.before_demand_insert();

-- ----------------------------------------------------------------------------
-- DEMANDA — histórico automático + completed_at na mudança de status
-- ----------------------------------------------------------------------------
create or replace function app.log_demand_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor uuid := app.current_person_id();
begin
  if new.status is distinct from old.status then
    insert into public.demand_history(holding_id, demand_id, changed_by, field_changed, old_value, new_value)
      values (new.holding_id, new.id, actor, 'status', old.status::text, new.status::text);
    if new.status = 'finalizada' and old.status <> 'finalizada' then
      new.completed_at := now();
    elsif new.status <> 'finalizada' then
      new.completed_at := null;
    end if;
  end if;

  if new.responsible_id is distinct from old.responsible_id then
    insert into public.demand_history(holding_id, demand_id, changed_by, field_changed, old_value, new_value)
      values (new.holding_id, new.id, actor, 'responsible_id', old.responsible_id::text, new.responsible_id::text);
  end if;

  if new.priority is distinct from old.priority then
    insert into public.demand_history(holding_id, demand_id, changed_by, field_changed, old_value, new_value)
      values (new.holding_id, new.id, actor, 'priority', old.priority::text, new.priority::text);
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.demand_history(holding_id, demand_id, changed_by, field_changed, old_value, new_value)
      values (new.holding_id, new.id, actor, 'due_date', old.due_date::text, new.due_date::text);
  end if;

  return new;
end;
$$;

create trigger trg_demands_log_changes
  before update on public.demands
  for each row execute function app.log_demand_changes();

-- ----------------------------------------------------------------------------
-- NOTA DE ARQUITETURA — sessões de evento (abrir/fechar):
-- A orquestração "abrir evento -> vira sessão ativa -> fechar evento" fica na
-- CAMADA DE APLICAÇÃO (Server Actions na web e webhook do WhatsApp), porque
-- envolve resposta ao usuário e detecção de comando em linguagem natural.
-- O banco apenas garante o VÍNCULO automático da demanda à sessão aberta
-- (via before_demand_insert acima), funcionando para qualquer canal.
-- ----------------------------------------------------------------------------
