-- Usuários da instância para o CBX: + data de cadastro e dias ativos (para a "chama").
drop function if exists public.cbx_holding_users(uuid);
create or replace function public.cbx_holding_users(p_holding uuid)
returns table(
  id uuid, full_name text, email text, role_title text,
  is_active boolean, is_admin boolean, has_login boolean,
  created_at timestamptz, last_sign_in_at timestamptz, active_days text[]
)
language sql stable security definer set search_path to 'public'
as $$
  select pe.id, pe.full_name, pe.email, pe.role_title, pe.is_active,
    exists (select 1 from public.memberships m where m.person_id = pe.id and m.role = 'holding_admin' and m.scope_id = pe.holding_id),
    (pe.auth_user_id is not null),
    pe.created_at,
    u.last_sign_in_at,
    coalesce((
      select array_agg(distinct to_char((d.completed_at at time zone 'America/Sao_Paulo')::date, 'YYYY-MM-DD'))
      from public.demands d
      where d.responsible_id = pe.id and d.status = 'finalizada'
        and d.completed_at is not null and d.completed_at > now() - interval '60 days'
    ), '{}') as active_days
  from public.people pe
  left join auth.users u on u.id = pe.auth_user_id
  where app.is_cbx_staff() and pe.holding_id = p_holding and not pe.is_ghost
  order by pe.full_name;
$$;
