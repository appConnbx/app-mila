-- ============================================================================
-- APP MILA — Migration 0008: função public.my_instances()
-- Lista as instâncias (holdings/famílias) do usuário logado, para o seletor de
-- instância. SECURITY DEFINER para enxergar todas as instâncias do usuário
-- (o RLS de people/holdings mostra só a instância ativa). Em schema public
-- para ser chamável via RPC (supabase.rpc('my_instances')).
-- ============================================================================

create or replace function public.my_instances()
returns table (
  holding_id   uuid,
  holding_name text,
  kind         app.account_kind,
  person_id    uuid,
  role_title   text
)
language sql stable security definer set search_path = public as $$
  select p.holding_id, h.name, h.kind, p.id, p.role_title
  from public.people p
  join public.holdings h on h.id = p.holding_id
  where p.auth_user_id = auth.uid()
    and p.is_active
  order by h.kind, h.name;
$$;

revoke all on function public.my_instances() from public;
grant execute on function public.my_instances() to authenticated;
