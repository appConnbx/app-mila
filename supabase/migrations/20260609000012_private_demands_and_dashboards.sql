-- ============================================================================
-- APP MILA — Migration 0012: Visibilidade de demandas + dashboards
--   - demands.visibility (private padrão | public) + helper app.shares_team
--   - Demandas privadas: só responsável/criador veem. Públicas: corporativo →
--     equipe do criador + admins acima; família → toda a holding.
--   - RPCs: public.my_overview() (pessoal cross-instância) e
--     public.manager_overview() (agregados gerenciais, sem expor linhas).
-- ============================================================================

create type app.demand_visibility as enum ('private','public');
alter table public.demands add column visibility app.demand_visibility not null default 'private';

create or replace function app.shares_team(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.team_members ta
    join public.team_members tb on tb.team_id = ta.team_id
    where ta.person_id = _a and tb.person_id = _b
  );
$$;

create or replace function app.can_see_demand(_demand uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.demands d
    where d.id = _demand
      and d.holding_id = app.current_holding_id()
      and (
        d.responsible_id = app.current_person_id()
        or d.origin_id = app.current_person_id()
        or (d.visibility = 'public' and (
              exists (select 1 from public.holdings h where h.id = d.holding_id and h.kind = 'family')
              or app.shares_team(app.current_person_id(), d.origin_id)
              or app.can_oversee(d.origin_id)
        ))
      )
  );
$$;

drop policy if exists demands_select on public.demands;
create policy demands_select on public.demands for select using (
  holding_id = app.current_holding_id()
  and (
    responsible_id = app.current_person_id()
    or origin_id = app.current_person_id()
    or (visibility = 'public' and (
          exists (select 1 from public.holdings h where h.id = holding_id and h.kind = 'family')
          or app.shares_team(app.current_person_id(), origin_id)
          or app.can_oversee(origin_id)
    ))
  )
);

drop policy if exists demands_update on public.demands;
create policy demands_update on public.demands for update using (
  holding_id = app.current_holding_id()
  and (responsible_id = app.current_person_id() or origin_id = app.current_person_id())
) with check (holding_id = app.current_holding_id());

drop policy if exists demands_delete on public.demands;
create policy demands_delete on public.demands for delete using (
  holding_id = app.current_holding_id()
  and origin_id = app.current_person_id()
);

-- Dashboard PESSOAL (cross-instância, por auth.uid())
create or replace function public.my_overview()
returns jsonb language sql stable security definer set search_path = public, app as $$
  with my_people as (
    select id from public.people where auth_user_id = auth.uid()
  ),
  mine as (
    select d.* from public.demands d
    where d.responsible_id in (select id from my_people)
  )
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'pending', (select count(*) from mine where status = 'nova'),
      'working', (select count(*) from mine where status = 'trabalhando'),
      'overdue', (select count(*) from mine where status <> 'finalizada' and due_date is not null and due_date < current_date),
      'done',    (select count(*) from mine where status = 'finalizada')
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', to_char(g.d, 'YYYY-MM-DD'), 'completed', (
                 select count(*) from mine m where m.completed_at::date = g.d
             )) order by g.d)
      from generate_series(current_date - interval '59 days', current_date, interval '1 day') g(d)
    ), '[]'::jsonb)
  );
$$;
grant execute on function public.my_overview() to authenticated;

-- Dashboard GERENCIAL (agregados; só o que o chamador administra)
create or replace function public.manager_overview()
returns jsonb language sql stable security definer set search_path = public, app as $$
  with scope as (
    select d.* from public.demands d
    where d.holding_id = app.current_holding_id()
      and app.can_oversee(d.responsible_id)
  )
  select jsonb_build_object(
    'overall', jsonb_build_object(
      'open',    (select count(*) from scope where status = 'nova'),
      'working', (select count(*) from scope where status = 'trabalhando'),
      'overdue', (select count(*) from scope where status <> 'finalizada' and due_date is not null and due_date < current_date),
      'done',    (select count(*) from scope where status = 'finalizada')
    ),
    'by_person', coalesce((
      select jsonb_agg(x order by (x->>'done')::int desc, (x->>'total')::int desc) from (
        select jsonb_build_object(
          'id', p.id, 'name', p.full_name,
          'total',   count(*),
          'working', count(*) filter (where s.status = 'trabalhando'),
          'overdue', count(*) filter (where s.status <> 'finalizada' and s.due_date is not null and s.due_date < current_date),
          'done',    count(*) filter (where s.status = 'finalizada')
        ) as x
        from scope s join public.people p on p.id = s.responsible_id
        group by p.id, p.full_name
      ) z
    ), '[]'::jsonb),
    'by_team', coalesce((
      select jsonb_agg(x order by x->>'name') from (
        select jsonb_build_object(
          'id', t.id, 'name', t.name,
          'total',   count(*),
          'working', count(*) filter (where s.status = 'trabalhando'),
          'overdue', count(*) filter (where s.status <> 'finalizada' and s.due_date is not null and s.due_date < current_date),
          'done',    count(*) filter (where s.status = 'finalizada')
        ) as x
        from scope s
        join public.team_members tm on tm.person_id = s.responsible_id
        join public.teams t on t.id = tm.team_id
        group by t.id, t.name
      ) y
    ), '[]'::jsonb)
  );
$$;
grant execute on function public.manager_overview() to authenticated;
