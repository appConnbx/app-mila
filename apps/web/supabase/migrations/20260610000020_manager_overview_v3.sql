-- Painel gerencial v3: KPIs acionáveis (abertas/trabalhando/próximas/atrasadas),
-- tabela por ÁREA, person_ids por área/equipe (p/ somar chamas no app) e
-- acesso para admins de qualquer nível (org/área/equipe veem seu escopo via can_oversee).

-- É admin de algum nível? (gate do menu/página; o escopo dos dados é do can_oversee)
create or replace function public.is_manager()
returns boolean
language sql stable security definer set search_path = public as $$
  select app.is_platform_admin() or exists (
    select 1 from public.memberships m
    where m.person_id = app.current_person_id()
      and m.role in ('holding_admin','org_admin','area_admin','team_admin')
  );
$$;

create or replace function public.manager_overview()
returns jsonb
language sql stable security definer
set search_path to 'public', 'app'
as $$
  with scope as (
    select d.* from public.demands d
    join public.people rp on rp.id = d.responsible_id and rp.is_active
    where d.holding_id = app.current_holding_id()
      and app.can_oversee(d.responsible_id)
  )
  select jsonb_build_object(
    'overall', jsonb_build_object(
      'open',     (select count(*) from scope where status = 'nova'),
      'working',  (select count(*) from scope where status = 'trabalhando'),
      'due_soon', (select count(*) from scope where status <> 'finalizada' and due_date = current_date),
      'overdue',  (select count(*) from scope where status <> 'finalizada' and due_date is not null and due_date < current_date)
    ),
    'by_person', coalesce((
      select jsonb_agg(x order by (x->>'done')::int desc, (x->>'total')::int desc) from (
        select jsonb_build_object(
          'id', p.id, 'name', p.full_name,
          'total',   count(*),
          'working', count(*) filter (where s.status = 'trabalhando'),
          'overdue', count(*) filter (where s.status <> 'finalizada' and s.due_date is not null and s.due_date < current_date),
          'done',    count(*) filter (where s.status = 'finalizada'),
          'active_days', coalesce(array_agg(distinct to_char(s.completed_at, 'YYYY-MM-DD'))
                           filter (where s.completed_at is not null and s.completed_at >= current_date - interval '60 days'), '{}')
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
          'done',    count(*) filter (where s.status = 'finalizada'),
          'person_ids', to_jsonb(array_agg(distinct s.responsible_id))
        ) as x
        from scope s
        join public.team_members tm on tm.person_id = s.responsible_id
        join public.teams t on t.id = tm.team_id and t.is_active
        group by t.id, t.name
      ) y
    ), '[]'::jsonb),
    'by_area', coalesce((
      select jsonb_agg(x order by x->>'name') from (
        select jsonb_build_object(
          'id', a.id, 'name', a.name,
          'total',   count(*),
          'working', count(*) filter (where s.status = 'trabalhando'),
          'overdue', count(*) filter (where s.status <> 'finalizada' and s.due_date is not null and s.due_date < current_date),
          'done',    count(*) filter (where s.status = 'finalizada'),
          'person_ids', to_jsonb(array_agg(distinct s.responsible_id))
        ) as x
        from scope s
        join public.team_members tm on tm.person_id = s.responsible_id
        join public.teams t on t.id = tm.team_id and t.is_active
        join public.areas a on a.id = t.area_id and a.is_active
        group by a.id, a.name
      ) w
    ), '[]'::jsonb)
  );
$$;
