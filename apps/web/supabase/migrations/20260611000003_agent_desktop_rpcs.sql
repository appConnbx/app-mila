-- RPCs do agente desktop (widget): agregam TODAS as instâncias do usuário,
-- sem depender do header x-holding-id (que o agente não envia).
-- Segurança: SECURITY DEFINER restrito a auth.uid() — o usuário só vê/cria o que é dele.

-- Instâncias ativas do usuário (para o seletor do "criar demanda").
create or replace function public.agent_holdings()
returns table (id uuid, name text, kind text)
language sql stable security definer set search_path = public
as $$
  select distinct h.id, h.name, h.kind::text
  from public.holdings h
  join public.people p on p.holding_id = h.id
  where p.auth_user_id = auth.uid()
    and p.is_active
    and h.status = 'active'
  order by h.name;
$$;

-- Demandas pendentes do usuário (responsável = ele), em todas as instâncias.
create or replace function public.agent_pending_demands()
returns table (
  id uuid,
  holding_id uuid,
  holding_name text,
  holding_kind text,
  title text,
  status text,
  priority text,
  due_date date,
  created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select d.id, d.holding_id, h.name, h.kind::text, d.title,
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

-- Criação rápida: demanda para si mesmo na instância escolhida (espelha o web:
-- origin = pessoa do usuário na instância, visibility private, channel api).
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
     p_priority::demand_priority, p_due_date, 'private', 'api', 'nova')
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.agent_holdings() from public;
revoke all on function public.agent_pending_demands() from public;
revoke all on function public.agent_create_demand(uuid, text, text, date, text) from public;
grant execute on function public.agent_holdings() to authenticated;
grant execute on function public.agent_pending_demands() to authenticated;
grant execute on function public.agent_create_demand(uuid, text, text, date, text) to authenticated;
