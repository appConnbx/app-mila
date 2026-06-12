-- Performance: índices nas FKs sem cobertura (advisors) + RLS sem reavaliar
-- auth.uid() linha a linha. Sem mudança de comportamento.

-- ----- Índices (tabelas quentes primeiro) -----
create index if not exists idx_demands_area on public.demands (area_id);
create index if not exists idx_demands_organization on public.demands (organization_id);
create index if not exists idx_demands_team on public.demands (team_id);
create index if not exists idx_demand_history_holding on public.demand_history (holding_id);
create index if not exists idx_demand_history_changed_by on public.demand_history (changed_by);
create index if not exists idx_demand_observations_holding on public.demand_observations (holding_id);
create index if not exists idx_demand_observations_author on public.demand_observations (author_id);
create index if not exists idx_events_holding on public.events (holding_id);
create index if not exists idx_events_organization on public.events (organization_id);
create index if not exists idx_event_participants_holding on public.event_participants (holding_id);
create index if not exists idx_memberships_holding on public.memberships (holding_id);
create index if not exists idx_people_active_event on public.people (active_event_id);
create index if not exists idx_person_aliases_holding on public.person_aliases (holding_id);
create index if not exists idx_areas_holding on public.areas (holding_id);
create index if not exists idx_teams_holding on public.teams (holding_id);
create index if not exists idx_teams_organization on public.teams (organization_id);
create index if not exists idx_team_members_holding on public.team_members (holding_id);
create index if not exists idx_subscriptions_plan on public.subscriptions (plan_id);
create index if not exists idx_billing_events_holding on public.billing_events (holding_id);
create index if not exists idx_billing_events_subscription on public.billing_events (subscription_id);
create index if not exists idx_whatsapp_messages_holding on public.whatsapp_messages (holding_id);
create index if not exists idx_whatsapp_messages_person on public.whatsapp_messages (person_id);
create index if not exists idx_whatsapp_messages_demand on public.whatsapp_messages (created_demand_id);
create index if not exists idx_whatsapp_messages_event on public.whatsapp_messages (created_event_id);

-- ----- RLS initplan: (select auth.uid()) avalia 1x por query, não por linha -----
alter policy platform_admins_self on public.platform_admins
  using (auth_user_id = (select auth.uid()));
alter policy profiles_insert on public.profiles
  with check (auth_user_id = (select auth.uid()));
alter policy profiles_update on public.profiles
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));
