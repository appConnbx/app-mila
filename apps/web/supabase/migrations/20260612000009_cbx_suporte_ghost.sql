-- Área Suporte do portal CBX: tickets e acesso temporário assistido (ghost).
-- O ghost é um usuário invisível ao cliente: filtrado na RLS de people, no
-- holding_users, no org_chart e fora da contagem de assentos.

alter table public.people add column if not exists is_ghost boolean not null default false;

-- RLS de people: ninguém do cliente enxerga ghosts (só o próprio ghost se vê).
drop policy if exists people_select on public.people;
create policy people_select on public.people for select
  using (holding_id = app.current_holding_id() and (not is_ghost or auth_user_id = auth.uid()));

drop policy if exists people_update on public.people;
create policy people_update on public.people for update
  using (
    holding_id = app.current_holding_id()
    and (not is_ghost or auth_user_id = auth.uid())
    and ((id = app.current_person_id()) or app.has_role('holding_admin'::app.member_role, holding_id))
  );

drop policy if exists people_delete on public.people;
create policy people_delete on public.people for delete
  using (
    holding_id = app.current_holding_id()
    and not is_ghost
    and app.has_role('holding_admin'::app.member_role, holding_id)
  );

-- Assentos: ghost não consome licença nem é bloqueado por plano lotado.
create or replace function app.enforce_seat_limit()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
declare
  lim  integer := app.account_seat_limit(new.holding_id);
  used integer;
begin
  if new.is_ghost then
    return new;
  end if;
  if lim is null then
    return new;
  end if;
  select count(*) into used from public.people
   where holding_id = new.holding_id and is_active and not is_ghost;
  if used >= lim then
    raise exception 'Limite de % usuário(s) atingido para esta conta. Faça upgrade do plano.', lim;
  end if;
  return new;
end;
$$;

-- Gestão de usuários do cliente: ghosts nunca aparecem.
create or replace function public.holding_users()
returns table(id uuid, full_name text, email text, role_title text, is_active boolean, can_delegate boolean, is_admin boolean, teams text[], avatar_url text, last_sign_in_at timestamptz, has_active_session boolean)
language sql stable security definer set search_path to 'public'
as $$
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
    and not p.is_ghost
    and app.is_holding_admin()
  order by p.is_active desc, p.full_name;
$$;

-- Organograma: ghosts fora de admins e membros (todas as 5 junções de people).
create or replace function public.org_chart()
returns jsonb language sql stable security definer set search_path to 'public', 'app'
as $$
  select case when app.current_person_id() is null then jsonb_build_object('orgs', '[]'::jsonb)
  else jsonb_build_object(
    'holding_name', (select name from public.holdings where id = app.current_holding_id()),
    'holding_logo', (select logo_url from public.holdings where id = app.current_holding_id()),
    'holding_admins', (
      select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
              'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
      from public.memberships m join public.people p on p.id = m.person_id and p.is_active and not p.is_ghost
      left join public.profiles pr on pr.auth_user_id = p.auth_user_id
      where m.role = 'holding_admin' and m.scope_id = app.current_holding_id()
    ),
    'orgs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'name', o.name, 'is_active', o.is_active, 'logo_url', o.logo_url,
        'admins', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                    'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                   from public.memberships m join public.people p on p.id = m.person_id and p.is_active and not p.is_ghost
                   left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                   where m.role = 'org_admin' and m.scope_id = o.id),
        'areas', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', a.id, 'name', a.name, 'is_active', a.is_active,
            'admins', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                        'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                       from public.memberships m join public.people p on p.id = m.person_id and p.is_active and not p.is_ghost
                       left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                       where m.role = 'area_admin' and m.scope_id = a.id),
            'teams', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', t.id, 'name', t.name, 'is_active', t.is_active,
                'admins', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                            'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                           from public.memberships m join public.people p on p.id = m.person_id and p.is_active and not p.is_ghost
                           left join public.profiles pr on pr.auth_user_id = p.auth_user_id
                           where m.role = 'team_admin' and m.scope_id = t.id),
                'members', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'avatar_url', pr.avatar_url,
                            'headline', pr.headline, 'phone', pr.phone, 'skills', coalesce(pr.skills, '{}')) order by p.full_name), '[]'::jsonb)
                            from public.team_members tm join public.people p on p.id = tm.person_id and p.is_active and not p.is_ghost
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

-- Tickets de atendimento.
create table if not exists public.cbx_tickets (
  id uuid primary key default gen_random_uuid(),
  holding_id uuid references public.holdings(id) on delete set null,
  client_name text not null,
  title text not null,
  description text,
  type text not null check (type in ('incidente','solicitacao')),
  status text not null default 'aberto' check (status in ('aberto','em_atendimento','resolvido')),
  assignee_staff_id uuid references public.cbx_staff(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.cbx_tickets enable row level security;
create index if not exists idx_cbx_tickets_status on public.cbx_tickets (status, created_at desc);

create table if not exists public.cbx_ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.cbx_tickets(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.cbx_ticket_comments enable row level security;
create index if not exists idx_cbx_ticket_comments on public.cbx_ticket_comments (ticket_id, created_at);

create or replace function public.cbx_list_tickets(p_status text default null)
returns table(
  id uuid, holding_id uuid, client_name text, title text, description text,
  type text, status text, assignee_name text, created_by_name text,
  created_at timestamptz, resolved_at timestamptz, comment_count bigint
)
language sql stable security definer set search_path to 'public'
as $$
  select t.id, t.holding_id, t.client_name, t.title, t.description, t.type, t.status,
         s.full_name, t.created_by_name, t.created_at, t.resolved_at,
         (select count(*) from public.cbx_ticket_comments c where c.ticket_id = t.id)
  from public.cbx_tickets t
  left join public.cbx_staff s on s.id = t.assignee_staff_id
  where app.cbx_has_permission('SUPORTE')
    and (p_status is null or t.status = p_status)
  order by (t.status = 'resolvido'), t.created_at desc;
$$;

create or replace function public.cbx_create_ticket(
  p_holding uuid, p_title text, p_description text, p_type text, p_assignee uuid default null
)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_client text; v_id uuid;
begin
  if not app.cbx_has_permission('SUPORTE') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  select name into v_client from public.holdings where id = p_holding;
  if v_client is null then
    return jsonb_build_object('ok', false, 'reason', 'client_not_found');
  end if;
  insert into public.cbx_tickets (holding_id, client_name, title, description, type, assignee_staff_id, created_by_name)
  values (p_holding, v_client, btrim(p_title), nullif(btrim(coalesce(p_description,'')),''), p_type, p_assignee, app.cbx_actor_name())
  returning id into v_id;
  perform app.cbx_audit('ticket_criado', v_client, jsonb_build_object('ticket_id', v_id, 'titulo', p_title, 'tipo', p_type));
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.cbx_update_ticket(p_id uuid, p_status text, p_assignee uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_client text;
begin
  if not app.cbx_has_permission('SUPORTE') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  update public.cbx_tickets
     set status = coalesce(p_status, status),
         assignee_staff_id = coalesce(p_assignee, assignee_staff_id),
         resolved_at = case when p_status = 'resolvido' then now()
                            when p_status in ('aberto','em_atendimento') then null
                            else resolved_at end,
         updated_at = now()
   where id = p_id
   returning client_name into v_client;
  if v_client is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  perform app.cbx_audit('ticket_atualizado', v_client, jsonb_build_object('ticket_id', p_id, 'status', p_status));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.cbx_ticket_comments(p_id uuid)
returns table(id uuid, author_name text, body text, created_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select c.id, c.author_name, c.body, c.created_at
  from public.cbx_ticket_comments c
  where app.cbx_has_permission('SUPORTE') and c.ticket_id = p_id
  order by c.created_at;
$$;

create or replace function public.cbx_add_ticket_comment(p_id uuid, p_body text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
begin
  if not app.cbx_has_permission('SUPORTE') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if btrim(coalesce(p_body,'')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;
  insert into public.cbx_ticket_comments (ticket_id, author_name, body)
  values (p_id, app.cbx_actor_name(), btrim(p_body));
  update public.cbx_tickets set updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- Acesso temporário assistido (ghost).
create table if not exists public.cbx_support_access (
  id uuid primary key default gen_random_uuid(),
  holding_id uuid not null references public.holdings(id) on delete cascade,
  ghost_auth_id uuid not null,
  ghost_person_id uuid references public.people(id) on delete set null,
  ghost_email text not null,
  created_by_name text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.cbx_support_access enable row level security;
create index if not exists idx_cbx_support_ghost on public.cbx_support_access (ghost_auth_id);

-- Registra o ghost (o auth.users é criado pelo servidor com service_role).
create or replace function public.cbx_register_support_access(
  p_holding uuid, p_ghost_auth uuid, p_ghost_email text, p_hours int default 4
)
returns jsonb language plpgsql security definer set search_path to 'public', 'app'
as $$
declare v_org uuid; v_person uuid; v_id uuid; v_client text;
begin
  if not app.cbx_has_permission('SUPORTE') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  select name into v_client from public.holdings where id = p_holding;
  if v_client is null then
    return jsonb_build_object('ok', false, 'reason', 'client_not_found');
  end if;
  select id into v_org from public.organizations
   where holding_id = p_holding order by created_at limit 1;
  if v_org is null then
    return jsonb_build_object('ok', false, 'reason', 'no_organization');
  end if;

  insert into public.people (holding_id, organization_id, full_name, email, auth_user_id, can_delegate, is_ghost)
  values (p_holding, v_org, 'Suporte CONNBX', p_ghost_email, p_ghost_auth, true, true)
  returning id into v_person;

  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
  values (p_holding, v_person, 'holding_admin', 'holding', p_holding);

  insert into public.cbx_support_access (holding_id, ghost_auth_id, ghost_person_id, ghost_email, created_by_name, expires_at)
  values (p_holding, p_ghost_auth, v_person, p_ghost_email, app.cbx_actor_name(),
          now() + make_interval(hours => greatest(coalesce(p_hours, 4), 1)))
  returning id into v_id;

  perform app.cbx_audit('acesso_suporte_criado', v_client,
    jsonb_build_object('access_id', v_id, 'holding_id', p_holding, 'expira', now() + make_interval(hours => greatest(coalesce(p_hours,4),1))));
  return jsonb_build_object('ok', true, 'id', v_id, 'person_id', v_person);
end;
$$;

create or replace function public.cbx_list_support_access()
returns table(
  id uuid, holding_id uuid, client_name text, ghost_email text,
  created_by_name text, created_at timestamptz, expires_at timestamptz,
  revoked_at timestamptz, is_valid boolean, ghost_auth_id uuid
)
language sql stable security definer set search_path to 'public'
as $$
  select sa.id, sa.holding_id, h.name, sa.ghost_email, sa.created_by_name,
         sa.created_at, sa.expires_at, sa.revoked_at,
         (sa.revoked_at is null and sa.expires_at > now()), sa.ghost_auth_id
  from public.cbx_support_access sa
  join public.holdings h on h.id = sa.holding_id
  where app.cbx_has_permission('SUPORTE')
  order by sa.created_at desc
  limit 100;
$$;

-- Revogação manual (o servidor também apaga o auth.users via service_role).
create or replace function public.cbx_revoke_support_access(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_ghost uuid; v_person uuid; v_client text;
begin
  if not app.cbx_has_permission('SUPORTE') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  update public.cbx_support_access
     set revoked_at = coalesce(revoked_at, now())
   where id = p_id
   returning ghost_auth_id, ghost_person_id into v_ghost, v_person;
  if v_ghost is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  update public.people set is_active = false where id = v_person;
  select h.name into v_client from public.cbx_support_access sa join public.holdings h on h.id = sa.holding_id where sa.id = p_id;
  perform app.cbx_audit('acesso_suporte_revogado', v_client, jsonb_build_object('access_id', p_id));
  return jsonb_build_object('ok', true, 'ghost_auth_id', v_ghost);
end;
$$;

-- Logout do ghost: auto-revoga (chamado pela rota de signout com a sessão dele).
create or replace function public.support_signout_cleanup()
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_uid uuid := auth.uid(); v_count int;
begin
  if v_uid is null then return jsonb_build_object('is_ghost', false); end if;
  update public.cbx_support_access
     set revoked_at = coalesce(revoked_at, now())
   where ghost_auth_id = v_uid;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return jsonb_build_object('is_ghost', false);
  end if;
  update public.people set is_active = false where auth_user_id = v_uid and is_ghost;
  insert into public.cbx_audit_log (actor_auth_id, actor_name, action, target, details)
  values (v_uid, 'Suporte CONNBX', 'acesso_suporte_logout', null, jsonb_build_object('ghost_auth_id', v_uid));
  return jsonb_build_object('is_ghost', true);
end;
$$;

-- Atividade: ghost expirado/revogado é derrubado pelo middleware.
create or replace function public.touch_activity()
returns text language plpgsql security definer set search_path to 'public'
as $$
declare v_uid uuid := auth.uid(); v_max timestamptz;
begin
  if v_uid is null then return 'active'; end if;
  if exists (
    select 1 from public.cbx_support_access sa
    where sa.ghost_auth_id = v_uid
      and (sa.revoked_at is not null or sa.expires_at < now())
  ) then
    return 'expired';
  end if;
  select max(last_activity_at) into v_max from public.people where auth_user_id = v_uid;
  if v_max is not null and v_max < now() - interval '30 minutes' then
    return 'expired';
  end if;
  if v_max is null or v_max < now() - interval '60 seconds' then
    update public.people set last_activity_at = now() where auth_user_id = v_uid;
  end if;
  return 'active';
end;
$$;
