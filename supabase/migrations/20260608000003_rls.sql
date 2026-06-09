-- ============================================================================
-- APP MILA — Migration 0003: Row Level Security (RLS)
-- A fronteira de segurança real. Mesmo que a UI falhe, o banco garante que:
--   - ninguém enxerga dados de outra holding (isolamento multiempresa / SaaS);
--   - cada nível vê apenas o seu escopo;
--   - delegar demanda a terceiros exige can_delegate.
-- O webhook do WhatsApp usa a service_role key, que ignora o RLS por design;
-- por isso a regra de delegação é REVALIDADA no código do webhook.
-- ============================================================================

-- Permitir que os papéis do Supabase usem o schema/funções auxiliares.
grant usage on schema app to authenticated, anon, service_role;
grant execute on all functions in schema app to authenticated, anon, service_role;

-- Habilitar RLS em todas as tabelas.
alter table public.holdings            enable row level security;
alter table public.organizations       enable row level security;
alter table public.areas               enable row level security;
alter table public.teams               enable row level security;
alter table public.people              enable row level security;
alter table public.person_aliases      enable row level security;
alter table public.team_members        enable row level security;
alter table public.memberships         enable row level security;
alter table public.events              enable row level security;
alter table public.event_participants  enable row level security;
alter table public.demands             enable row level security;
alter table public.demand_observations enable row level security;
alter table public.demand_history      enable row level security;
alter table public.whatsapp_messages   enable row level security;

-- ----------------------------------------------------------------------------
-- HOLDINGS
-- ----------------------------------------------------------------------------
create policy holdings_select on public.holdings
  for select using (id = app.current_holding_id());
create policy holdings_write on public.holdings
  for all
  using (id = app.current_holding_id() and app.has_role('holding_admin', id))
  with check (id = app.current_holding_id() and app.has_role('holding_admin', id));

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS
-- ----------------------------------------------------------------------------
create policy organizations_select on public.organizations
  for select using (holding_id = app.current_holding_id());
create policy organizations_write on public.organizations
  for all
  using (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id) or app.has_role('org_admin', id)))
  with check (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id) or app.has_role('org_admin', id)));

-- ----------------------------------------------------------------------------
-- AREAS
-- ----------------------------------------------------------------------------
create policy areas_select on public.areas
  for select using (holding_id = app.current_holding_id());
create policy areas_write on public.areas
  for all
  using (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id)
              or app.has_role('org_admin', organization_id)
              or app.has_role('area_admin', id)))
  with check (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id)
              or app.has_role('org_admin', organization_id)
              or app.has_role('area_admin', id)));

-- ----------------------------------------------------------------------------
-- TEAMS
-- ----------------------------------------------------------------------------
create policy teams_select on public.teams
  for select using (holding_id = app.current_holding_id());
create policy teams_write on public.teams
  for all
  using (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id)
              or app.has_role('org_admin', organization_id)
              or app.has_role('area_admin', area_id)
              or app.has_role('team_admin', id)))
  with check (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id)
              or app.has_role('org_admin', organization_id)
              or app.has_role('area_admin', area_id)
              or app.has_role('team_admin', id)));

-- ----------------------------------------------------------------------------
-- PEOPLE  (todos da holding podem ver uns aos outros p/ escolher responsável;
--          escrita por admin de holding/organização; pessoa edita a si mesma)
-- ----------------------------------------------------------------------------
create policy people_select on public.people
  for select using (holding_id = app.current_holding_id());
create policy people_insert on public.people
  for insert with check (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id) or app.has_role('org_admin', organization_id)));
create policy people_update on public.people
  for update using (holding_id = app.current_holding_id()
         and (id = app.current_person_id()
              or app.has_role('holding_admin', holding_id)
              or app.has_role('org_admin', organization_id)))
  with check (holding_id = app.current_holding_id());
create policy people_delete on public.people
  for delete using (holding_id = app.current_holding_id()
         and (app.has_role('holding_admin', holding_id) or app.has_role('org_admin', organization_id)));

-- ----------------------------------------------------------------------------
-- PERSON_ALIASES
-- ----------------------------------------------------------------------------
create policy aliases_select on public.person_aliases
  for select using (holding_id = app.current_holding_id());
create policy aliases_write on public.person_aliases
  for all
  using (holding_id = app.current_holding_id()
         and (person_id = app.current_person_id() or app.can_oversee(person_id)))
  with check (holding_id = app.current_holding_id()
         and (person_id = app.current_person_id() or app.can_oversee(person_id)));

-- ----------------------------------------------------------------------------
-- TEAM_MEMBERS
-- ----------------------------------------------------------------------------
create policy team_members_select on public.team_members
  for select using (holding_id = app.current_holding_id());
create policy team_members_write on public.team_members
  for all
  using (holding_id = app.current_holding_id() and app.can_oversee(person_id))
  with check (holding_id = app.current_holding_id() and app.can_oversee(person_id));

-- ----------------------------------------------------------------------------
-- MEMBERSHIPS  (atribuir papéis: somente admin de holding/organização;
--               cada um vê os próprios papéis)
-- ----------------------------------------------------------------------------
create policy memberships_select on public.memberships
  for select using (holding_id = app.current_holding_id()
         and (person_id = app.current_person_id() or app.can_oversee(person_id)));
create policy memberships_write on public.memberships
  for all
  using (holding_id = app.current_holding_id() and app.can_oversee(person_id))
  with check (holding_id = app.current_holding_id() and app.can_oversee(person_id));

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create policy events_select on public.events
  for select using (app.can_see_event(id));
create policy events_insert on public.events
  for insert with check (holding_id = app.current_holding_id()
         and owner_id = app.current_person_id());
create policy events_update on public.events
  for update using (holding_id = app.current_holding_id()
         and (owner_id = app.current_person_id() or app.can_oversee(owner_id)))
  with check (holding_id = app.current_holding_id());
create policy events_delete on public.events
  for delete using (holding_id = app.current_holding_id()
         and (owner_id = app.current_person_id() or app.can_oversee(owner_id)));

-- ----------------------------------------------------------------------------
-- EVENT_PARTICIPANTS
-- ----------------------------------------------------------------------------
create policy event_participants_select on public.event_participants
  for select using (app.can_see_event(event_id));
create policy event_participants_write on public.event_participants
  for all
  using (holding_id = app.current_holding_id() and app.can_see_event(event_id))
  with check (holding_id = app.current_holding_id() and app.can_see_event(event_id));

-- ----------------------------------------------------------------------------
-- DEMANDS  (núcleo — inclui a regra de delegação)
-- ----------------------------------------------------------------------------
create policy demands_select on public.demands
  for select using (
    holding_id = app.current_holding_id()
    and (responsible_id = app.current_person_id()
         or origin_id = app.current_person_id()
         or app.can_oversee(responsible_id))
  );

create policy demands_insert on public.demands
  for insert with check (
    holding_id = app.current_holding_id()
    and origin_id = app.current_person_id()
    and (
      responsible_id = app.current_person_id()  -- sempre pode criar p/ si
      or (
        (select can_delegate from public.people where id = app.current_person_id())
        and exists (select 1 from public.people p
                    where p.id = responsible_id and p.holding_id = app.current_holding_id())
      )
    )
  );

create policy demands_update on public.demands
  for update using (
    holding_id = app.current_holding_id()
    and (responsible_id = app.current_person_id()
         or origin_id = app.current_person_id()
         or app.can_oversee(responsible_id))
  )
  with check (holding_id = app.current_holding_id());

create policy demands_delete on public.demands
  for delete using (
    holding_id = app.current_holding_id()
    and (origin_id = app.current_person_id() or app.can_oversee(responsible_id))
  );

-- ----------------------------------------------------------------------------
-- DEMAND_OBSERVATIONS
-- ----------------------------------------------------------------------------
create policy observations_select on public.demand_observations
  for select using (app.can_see_demand(demand_id));
create policy observations_insert on public.demand_observations
  for insert with check (
    holding_id = app.current_holding_id()
    and author_id = app.current_person_id()
    and app.can_see_demand(demand_id)
  );

-- ----------------------------------------------------------------------------
-- DEMAND_HISTORY  (somente leitura; inserção via trigger SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create policy history_select on public.demand_history
  for select using (app.can_see_demand(demand_id));

-- ----------------------------------------------------------------------------
-- WHATSAPP_MESSAGES  (leitura por admin; escrita via service_role no webhook)
-- ----------------------------------------------------------------------------
create policy whatsapp_select on public.whatsapp_messages
  for select using (
    holding_id = app.current_holding_id()
    and (app.has_role('holding_admin', holding_id)
         or person_id = app.current_person_id())
  );
