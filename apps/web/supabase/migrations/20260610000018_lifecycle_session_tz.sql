-- ============================================================
-- Correções: cascata de desativação (estrutura), reatribuição de demandas,
-- sessão por inatividade, fuso por instância.
-- ============================================================

-- 1) Colunas
alter table public.holdings add column if not exists timezone text not null default 'America/Sao_Paulo';
alter table public.people   add column if not exists last_activity_at timestamptz;

-- 2) Cascata de (des)ativação de estrutura — NUNCA toca em pessoas.
create or replace function public.set_structure_active(p_kind text, p_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare v_holding uuid := app.current_holding_id();
begin
  if not app.is_holding_admin() then raise exception 'not authorized'; end if;
  if p_kind = 'organization' then
    update public.organizations set is_active = p_active where id = p_id and holding_id = v_holding;
    if not p_active then
      update public.areas set is_active = false where organization_id = p_id and holding_id = v_holding;
      update public.teams set is_active = false where organization_id = p_id and holding_id = v_holding;
    end if;
  elsif p_kind = 'area' then
    update public.areas set is_active = p_active where id = p_id and holding_id = v_holding;
    if not p_active then
      update public.teams set is_active = false where area_id = p_id and holding_id = v_holding;
    end if;
  elsif p_kind = 'team' then
    update public.teams set is_active = p_active where id = p_id and holding_id = v_holding;
  end if;
end;
$$;

-- 3) Desativar pessoa + reatribuir demandas abertas ao admin da equipe dela.
create or replace function public.deactivate_person(p_id uuid)
returns integer
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_holding uuid := app.current_holding_id();
  v_actor   uuid := app.current_person_id();
  v_name    text;
  v_target  uuid;
  v_demand  record;
  v_count   int := 0;
begin
  if not app.is_holding_admin() then raise exception 'not authorized'; end if;
  select full_name into v_name from public.people where id = p_id and holding_id = v_holding;
  if v_name is null then raise exception 'person not in holding'; end if;

  update public.people set is_active = false where id = p_id;

  -- alvo: 1º team_admin ativo (≠ p_id) da 1ª equipe do usuário
  select m.person_id into v_target
  from public.team_members tm
  join public.memberships m on m.role = 'team_admin' and m.scope_id = tm.team_id
  join public.people ap on ap.id = m.person_id and ap.is_active and ap.id <> p_id
  where tm.person_id = p_id
  order by tm.created_at asc, m.created_at asc
  limit 1;

  if v_target is null then
    select m.person_id into v_target
    from public.memberships m
    join public.people ap on ap.id = m.person_id and ap.is_active and ap.id <> p_id
    where m.role = 'holding_admin' and m.scope_id = v_holding
    order by m.created_at asc
    limit 1;
  end if;

  if v_target is not null then
    for v_demand in
      select id from public.demands
      where holding_id = v_holding and responsible_id = p_id and status <> 'finalizada'
    loop
      update public.demands set responsible_id = v_target where id = v_demand.id;
      insert into public.demand_observations(holding_id, demand_id, author_id, body)
        values (v_holding, v_demand.id, coalesce(v_actor, v_target),
                'Demanda reatribuída automaticamente devido à desativação de ' || v_name || '.');
      v_count := v_count + 1;
    end loop;
  end if;
  return v_count;
end;
$$;

-- 4) Atividade/sessão: throttle de gravação + decisão de expiração (30 min).
create or replace function public.touch_activity()
returns text
language plpgsql security definer set search_path to 'public'
as $$
declare v_uid uuid := auth.uid(); v_max timestamptz;
begin
  if v_uid is null then return 'active'; end if;
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

-- 5) holding_users: "online" passa a refletir atividade nos últimos 30 min.
create or replace function public.holding_users()
returns table (
  id uuid, full_name text, email text, role_title text,
  is_active boolean, can_delegate boolean, is_admin boolean,
  teams text[], last_sign_in_at timestamptz, has_active_session boolean
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.full_name, p.email, p.role_title, p.is_active, p.can_delegate,
    exists (select 1 from public.memberships m
            where m.person_id = p.id and m.role = 'holding_admin' and m.scope_id = p.holding_id) as is_admin,
    coalesce((select array_agg(t.name order by t.name)
              from public.team_members tmx
              join public.teams t on t.id = tmx.team_id
              where tmx.person_id = p.id), '{}') as teams,
    u.last_sign_in_at,
    (p.last_activity_at is not null and p.last_activity_at > now() - interval '30 minutes') as has_active_session
  from public.people p
  left join auth.users u on u.id = p.auth_user_id
  where p.holding_id = app.current_holding_id()
    and app.is_holding_admin()
  order by p.is_active desc, p.full_name;
$$;
