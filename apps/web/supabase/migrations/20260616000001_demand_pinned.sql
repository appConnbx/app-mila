-- "Pinar como prioritária": destaque manual de uma demanda (contorno alaranjado
-- na web, mobile e agente). Vale para todas as instâncias. Coluna simples +
-- inclusão no RPC do agente/mobile, ordenando as pinadas no topo.

alter table public.demands add column if not exists pinned boolean not null default false;

-- Recriado (muda o tipo de retorno: + pinned), por isso o drop antes.
drop function if exists public.agent_pending_demands();

create function public.agent_pending_demands()
returns table(
  id uuid, holding_id uuid, holding_name text, holding_kind text,
  title text, description text, status text, priority text,
  due_date date, created_at timestamptz, pinned boolean
)
language sql stable security definer set search_path to 'public'
as $$
  select d.id, d.holding_id, h.name, h.kind::text, d.title, d.description,
         d.status::text, d.priority::text, d.due_date, d.created_at, d.pinned
  from public.demands d
  join public.people p on p.id = d.responsible_id
  join public.holdings h on h.id = d.holding_id
  where p.auth_user_id = auth.uid()
    and p.is_active
    and d.status <> 'finalizada'
  order by d.pinned desc,
           (d.status = 'trabalhando') desc,
           d.created_at asc;
$$;
