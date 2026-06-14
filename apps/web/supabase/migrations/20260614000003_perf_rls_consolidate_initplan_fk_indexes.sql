-- #20 Performance. Semantica de acesso preservada exatamente.
-- (1) 1 policy permissiva por acao: o padrao <t>_select (SELECT) + <t>_write (ALL)
--     fazia o FOR ALL reavaliar tambem no SELECT (2 permissivas). Separa o write
--     em INSERT/UPDATE/DELETE. Onde o write nao e subconjunto provavel do select
--     (memberships, event_participants), o select passa a (select OR write).
-- (2) initplan: embrulha auth.uid() em people em (select auth.uid()).
-- (3) indices de cobertura para FKs sem indice.

-- ---- areas (write exige holding_id=current AND admin => subconjunto do select)
drop policy if exists areas_write on public.areas;
create policy areas_insert on public.areas for insert
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy areas_update on public.areas for update
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id))
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy areas_delete on public.areas for delete
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));

-- ---- holdings
drop policy if exists holdings_write on public.holdings;
create policy holdings_insert on public.holdings for insert
  with check ((id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, id));
create policy holdings_update on public.holdings for update
  using ((id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, id))
  with check ((id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, id));
create policy holdings_delete on public.holdings for delete
  using ((id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, id));

-- ---- organizations
drop policy if exists organizations_write on public.organizations;
create policy organizations_insert on public.organizations for insert
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy organizations_update on public.organizations for update
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id))
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy organizations_delete on public.organizations for delete
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));

-- ---- person_aliases (write exige holding=current AND (eu OR oversee) => subconjunto)
drop policy if exists aliases_write on public.person_aliases;
create policy aliases_insert on public.person_aliases for insert
  with check ((holding_id = app.current_holding_id()) and ((person_id = app.current_person_id()) or app.can_oversee(person_id)));
create policy aliases_update on public.person_aliases for update
  using ((holding_id = app.current_holding_id()) and ((person_id = app.current_person_id()) or app.can_oversee(person_id)))
  with check ((holding_id = app.current_holding_id()) and ((person_id = app.current_person_id()) or app.can_oversee(person_id)));
create policy aliases_delete on public.person_aliases for delete
  using ((holding_id = app.current_holding_id()) and ((person_id = app.current_person_id()) or app.can_oversee(person_id)));

-- ---- team_members
drop policy if exists team_members_write on public.team_members;
create policy team_members_insert on public.team_members for insert
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy team_members_update on public.team_members for update
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id))
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy team_members_delete on public.team_members for delete
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));

-- ---- teams
drop policy if exists teams_write on public.teams;
create policy teams_insert on public.teams for insert
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy teams_update on public.teams for update
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id))
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy teams_delete on public.teams for delete
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));

-- ---- memberships (write NAO e subconjunto provavel do select => select = select OR write)
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select
  using (
    ((holding_id = app.current_holding_id()) and ((person_id = app.current_person_id()) or app.can_oversee(person_id)))
    or ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id))
  );
drop policy if exists memberships_write on public.memberships;
create policy memberships_insert on public.memberships for insert
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy memberships_update on public.memberships for update
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id))
  with check ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));
create policy memberships_delete on public.memberships for delete
  using ((holding_id = app.current_holding_id()) and app.has_role('holding_admin'::app.member_role, holding_id));

-- ---- event_participants (select = can_see_event OR write)
drop policy if exists event_participants_select on public.event_participants;
create policy event_participants_select on public.event_participants for select
  using (
    app.can_see_event(event_id)
    or ((holding_id = app.current_holding_id()) and (exists (
      select 1 from events e
      where e.id = event_participants.event_id
        and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
    )))
  );
drop policy if exists event_participants_write on public.event_participants;
create policy event_participants_insert on public.event_participants for insert
  with check ((holding_id = app.current_holding_id()) and (exists (
    select 1 from events e
    where e.id = event_participants.event_id
      and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
  )));
create policy event_participants_update on public.event_participants for update
  using ((holding_id = app.current_holding_id()) and (exists (
    select 1 from events e
    where e.id = event_participants.event_id
      and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
  )))
  with check ((holding_id = app.current_holding_id()) and (exists (
    select 1 from events e
    where e.id = event_participants.event_id
      and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
  )));
create policy event_participants_delete on public.event_participants for delete
  using ((holding_id = app.current_holding_id()) and (exists (
    select 1 from events e
    where e.id = event_participants.event_id
      and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
  )));

-- ---- (2) initplan: auth.uid() embrulhado em (select auth.uid())
alter policy people_select on public.people
  using ((holding_id = app.current_holding_id()) and ((not is_ghost) or (auth_user_id = (select auth.uid()))));
alter policy people_update on public.people
  using ((holding_id = app.current_holding_id()) and ((not is_ghost) or (auth_user_id = (select auth.uid()))) and ((id = app.current_person_id()) or app.has_role('holding_admin'::app.member_role, holding_id)));

-- ---- (3) indices de cobertura de FK
create index if not exists idx_cbx_support_access_ghost_person on public.cbx_support_access(ghost_person_id);
create index if not exists idx_cbx_support_access_holding on public.cbx_support_access(holding_id);
create index if not exists idx_cbx_tickets_assignee_staff on public.cbx_tickets(assignee_staff_id);
create index if not exists idx_cbx_tickets_holding on public.cbx_tickets(holding_id);
create index if not exists idx_subscriptions_sponsor_person on public.subscriptions(sponsor_person_id);
