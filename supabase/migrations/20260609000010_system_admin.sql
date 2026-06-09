-- ============================================================================
-- APP MILA — Migration 0010: Gestão de sistema (admin da holding)
--   - Estruturas podem ser DESATIVADAS (is_active) além de excluídas
--   - Apenas ADMIN DA HOLDING cria/edita/exclui estrutura e usuários e papéis
--   - RPCs: is_holding_admin() e holding_users() (data view de usuários)
-- ============================================================================

-- is_active nas estruturas (desativar sem excluir)
alter table public.organizations add column if not exists is_active boolean not null default true;
alter table public.areas         add column if not exists is_active boolean not null default true;
alter table public.teams         add column if not exists is_active boolean not null default true;

-- ----------------------------------------------------------------------------
-- É admin da holding (administrador do sistema)?
-- ----------------------------------------------------------------------------
create or replace function app.is_holding_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_platform_admin() or exists (
    select 1 from public.memberships m
    where m.person_id = app.current_person_id()
      and m.role = 'holding_admin'
      and m.scope_id = app.current_holding_id()
  );
$$;
grant execute on function app.is_holding_admin() to authenticated, anon, service_role;

-- Wrapper público (chamável via rpc)
create or replace function public.is_holding_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select app.is_holding_admin();
$$;
grant execute on function public.is_holding_admin() to authenticated, anon, service_role;

-- ----------------------------------------------------------------------------
-- Endurecer escrita: estrutura, usuários, papéis e membros = só admin da holding
-- ----------------------------------------------------------------------------
drop policy if exists organizations_write on public.organizations;
create policy organizations_write on public.organizations for all
  using (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id))
  with check (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

drop policy if exists areas_write on public.areas;
create policy areas_write on public.areas for all
  using (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id))
  with check (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

drop policy if exists teams_write on public.teams;
create policy teams_write on public.teams for all
  using (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id))
  with check (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

drop policy if exists people_insert on public.people;
create policy people_insert on public.people for insert
  with check (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

drop policy if exists people_update on public.people;
create policy people_update on public.people for update
  using (holding_id = app.current_holding_id()
         and (id = app.current_person_id() or app.has_role('holding_admin', holding_id)))
  with check (holding_id = app.current_holding_id());

drop policy if exists people_delete on public.people;
create policy people_delete on public.people for delete
  using (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

drop policy if exists memberships_write on public.memberships;
create policy memberships_write on public.memberships for all
  using (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id))
  with check (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

drop policy if exists team_members_write on public.team_members;
create policy team_members_write on public.team_members for all
  using (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id))
  with check (holding_id = app.current_holding_id() and app.has_role('holding_admin', holding_id));

-- ----------------------------------------------------------------------------
-- Data view de usuários (somente admin da holding lê; SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create or replace function public.holding_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role_title text,
  is_active boolean,
  can_delegate boolean,
  is_admin boolean,
  teams text[],
  last_sign_in_at timestamptz,
  has_active_session boolean
)
language sql stable security definer set search_path = public as $$
  select
    p.id,
    p.full_name,
    p.email,
    p.role_title,
    p.is_active,
    p.can_delegate,
    exists (select 1 from public.memberships m
            where m.person_id = p.id and m.role = 'holding_admin' and m.scope_id = p.holding_id) as is_admin,
    coalesce((select array_agg(t.name order by t.name)
              from public.team_members tmx
              join public.teams t on t.id = tmx.team_id
              where tmx.person_id = p.id), '{}') as teams,
    u.last_sign_in_at,
    exists (select 1 from auth.sessions s
            where s.user_id = p.auth_user_id
              and (s.not_after is null or s.not_after > now())) as has_active_session
  from public.people p
  left join auth.users u on u.id = p.auth_user_id
  where p.holding_id = app.current_holding_id()
    and app.is_holding_admin()
  order by p.is_active desc, p.full_name;
$$;
grant execute on function public.holding_users() to authenticated, service_role;
