-- Oculta inativos nas visões: organograma e painel/talentos.

-- org_chart: oculta organizações/áreas/equipes inativas e pessoas inativas.
create or replace function public.org_chart()
returns jsonb
language sql stable security definer set search_path to 'public', 'app'
as $$
  select case when app.current_person_id() is null then jsonb_build_object('orgs', '[]'::jsonb)
  else jsonb_build_object(
    'holding_name', (select name from public.holdings where id = app.current_holding_id()),
    'holding_admins', (
      select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
              'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
      from public.memberships m join public.people p on p.id = m.person_id and p.is_active
      left join public.profiles pr on pr.auth_user_id = p.auth_user_id
      where m.role = 'holding_admin' and m.scope_id = app.current_holding_id()
    ),
    'orgs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'name', o.name, 'is_active', o.is_active,
        'admins', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                    'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                   from public.memberships m join public.people p on p.id = m.person_id and p.is_active
                   left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                   where m.role = 'org_admin' and m.scope_id = o.id),
        'areas', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', a.id, 'name', a.name, 'is_active', a.is_active,
            'admins', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                        'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                       from public.memberships m join public.people p on p.id = m.person_id and p.is_active
                       left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                       where m.role = 'area_admin' and m.scope_id = a.id),
            'teams', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', t.id, 'name', t.name, 'is_active', t.is_active,
                'admins', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                            'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                           from public.memberships m join public.people p on p.id = m.person_id and p.is_active
                           left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                           where m.role = 'team_admin' and m.scope_id = t.id),
                'members', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                            'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                            from public.team_members tm join public.people p on p.id = tm.person_id and p.is_active
                            left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                            where tm.team_id = t.id)
              ) order by t.name)
              from public.teams t where t.area_id = a.id and t.is_active
            ), '[]'::jsonb)
          ) order by a.name)
          from public.areas a where a.organization_id = o.id and a.is_active
        ), '[]'::jsonb)
      ) order by o.name)
      from public.organizations o where o.holding_id = app.current_holding_id() and o.is_active
    ), '[]'::jsonb)
  ) end;
$$;

-- manager_overview: escopo conta só demandas de responsáveis ATIVOS.
create or replace function public.manager_overview()
returns jsonb
language sql stable security definer set search_path to 'public', 'app'
as $$
  with scope as (
    select d.* from public.demands d
    join public.people rp on rp.id = d.responsible_id and rp.is_active
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
