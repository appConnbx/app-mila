-- Ordenação das demandas no agente desktop e mobile: mais antiga → mais nova
-- (created_at asc), mantendo as 'trabalhando' em evidência no topo. Antes era
-- por due_date e created_at desc. Alinha com a lista do sistema web.
-- Só muda o ORDER BY; assinatura, grants e demais RPCs do v2 permanecem.

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
           d.created_at asc;
$$;
