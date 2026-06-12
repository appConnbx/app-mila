-- Opções de responsável (qualquer operador do portal; só ativos).
-- cbx_list_staff exige ADMIN — o Suporte precisa apenas de id+nome.
create or replace function public.cbx_staff_options()
returns table(id uuid, full_name text)
language sql stable security definer set search_path to 'public'
as $$
  select s.id, s.full_name
  from public.cbx_staff s
  where app.is_cbx_staff() and s.is_active
  order by s.full_name;
$$;
