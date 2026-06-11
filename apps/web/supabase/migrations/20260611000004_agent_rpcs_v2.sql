-- v2 dos RPCs do agente: corrige cast de enum (schema app — causa do erro de
-- criação no widget), inclui descrição na listagem e adiciona troca de status.

-- Pendentes agora com descrição (para exibir resumida no card).
drop function if exists public.agent_pending_demands();
create or replace function public.agent_pending_demands()
returns table (
  id uuid,
  holding_id uuid,
  holding_name text,
  holding_kind text,
  title text,
  description text,
  status text,
  priority text,
  due_date date,
  created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select d.id, d.holding_id, h.name, h.kind::text, d.title, d.description,
         d.status::text, d.priority::text, d.due_date, d.created_at
  from public.demands d
  join public.people p on p.id = d.responsible_id
  join public.holdings h on h.id = d.holding_id
  where p.auth_user_id = auth.uid()
    and p.is_active
    and d.status <> 'finalizada'
  order by (d.status = 'trabalhando') desc,
           d.due_date asc nulls last,
           d.created_at desc;
$$;

-- Criação: o enum demand_priority vive no schema app (causa do erro 42704).
create or replace function public.agent_create_demand(
  p_holding_id uuid,
  p_title text,
  p_description text default null,
  p_due_date date default null,
  p_priority text default 'media'
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_me uuid;
  v_id uuid;
begin
  select p.id into v_me
  from public.people p
  where p.auth_user_id = auth.uid()
    and p.holding_id = p_holding_id
    and p.is_active
  limit 1;
  if v_me is null then
    raise exception 'not_a_member';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'title_required';
  end if;

  insert into public.demands
    (holding_id, title, description, responsible_id, origin_id,
     priority, due_date, visibility, channel, status)
  values
    (p_holding_id, trim(p_title), nullif(trim(coalesce(p_description,'')),''), v_me, v_me,
     p_priority::app.demand_priority, p_due_date, 'private', 'api', 'nova')
  returning id into v_id;
  return v_id;
end;
$$;

-- Troca de status pelo widget: só o responsável muda as próprias demandas.
create or replace function public.agent_set_status(p_demand_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_ok boolean;
begin
  if p_status not in ('nova','trabalhando','finalizada') then
    raise exception 'invalid_status';
  end if;
  select exists (
    select 1 from public.demands d
    join public.people p on p.id = d.responsible_id
    where d.id = p_demand_id and p.auth_user_id = auth.uid() and p.is_active
  ) into v_ok;
  if not v_ok then
    raise exception 'not_allowed';
  end if;

  update public.demands
  set status = p_status::app.demand_status,
      completed_at = case when p_status = 'finalizada' then now() else null end,
      updated_at = now()
  where id = p_demand_id;
end;
$$;

revoke all on function public.agent_pending_demands() from public;
revoke all on function public.agent_create_demand(uuid, text, text, date, text) from public;
revoke all on function public.agent_set_status(uuid, text) from public;
grant execute on function public.agent_pending_demands() to authenticated;
grant execute on function public.agent_create_demand(uuid, text, text, date, text) to authenticated;
grant execute on function public.agent_set_status(uuid, text) to authenticated;
