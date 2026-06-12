-- holding_users: inclui o avatar da pessoa (profiles.avatar_url) para a
-- tela de gestão de usuários. Muda o RETURNS TABLE → recriar.
drop function if exists public.holding_users();
create or replace function public.holding_users()
returns table(id uuid, full_name text, email text, role_title text, is_active boolean,
  can_delegate boolean, is_admin boolean, teams text[], avatar_url text,
  last_sign_in_at timestamptz, has_active_session boolean)
language sql stable security definer set search_path to 'public'
as $function$
  select
    p.id, p.full_name, p.email, p.role_title, p.is_active, p.can_delegate,
    exists (select 1 from public.memberships m
            where m.person_id = p.id and m.role = 'holding_admin' and m.scope_id = p.holding_id) as is_admin,
    coalesce((select array_agg(t.name order by t.name)
              from public.team_members tmx
              join public.teams t on t.id = tmx.team_id
              where tmx.person_id = p.id), '{}') as teams,
    pr.avatar_url,
    u.last_sign_in_at,
    (p.last_activity_at is not null and p.last_activity_at > now() - interval '30 minutes') as has_active_session
  from public.people p
  left join auth.users u on u.id = p.auth_user_id
  left join public.profiles pr on pr.auth_user_id = p.auth_user_id
  where p.holding_id = app.current_holding_id()
    and app.is_holding_admin()
  order by p.is_active desc, p.full_name;
$function$;

-- org_chart: inclui o logo da holding (holding_logo) e o logo de cada
-- organização (logo_url). Demais campos inalterados.
create or replace function public.org_chart()
returns jsonb language sql stable security definer set search_path to 'public', 'app'
as $function$
  select case when app.current_person_id() is null then jsonb_build_object('orgs', '[]'::jsonb)
  else jsonb_build_object(
    'holding_name', (select name from public.holdings where id = app.current_holding_id()),
    'holding_logo', (select logo_url from public.holdings where id = app.current_holding_id()),
    'holding_admins', (
      select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
              'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
      from public.memberships m join public.people p on p.id = m.person_id and p.is_active
      left join public.profiles pr on pr.auth_user_id = p.auth_user_id
      where m.role = 'holding_admin' and m.scope_id = app.current_holding_id()
    ),
    'orgs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'name', o.name, 'is_active', o.is_active, 'logo_url', o.logo_url,
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
$function$;
