-- Instância staff do portal CBX: ser MEMBRO da "staff holding" (CONNBX) libera
-- o acesso ao /cbx. As ÁREAS (CEO/Financeiro/Comercial/Suporte/Admin) continuam
-- governadas por permissões (cbx_staff) ou master. A staff holding é marcada por
-- uma flag única (não depende do nome, que pode ser renomeado).

alter table public.holdings
  add column if not exists is_staff_holding boolean not null default false;

-- No máximo UMA staff holding no sistema.
create unique index if not exists holdings_one_staff_holding
  on public.holdings ((true)) where is_staff_holding;

-- GATE de acesso ao portal: master, staff registrado, OU membro ativo da staff holding.
create or replace function app.is_cbx_staff()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select app.is_platform_admin()
    or exists (
      select 1 from public.cbx_staff s where s.auth_user_id = auth.uid() and s.is_active
    )
    or exists (
      select 1 from public.people p
      join public.holdings h on h.id = p.holding_id
      where p.auth_user_id = auth.uid() and p.is_active and h.is_staff_holding
    );
$$;

-- Nome do operador para auditoria: master, staff, ou pessoa da staff holding.
create or replace function app.cbx_actor_name()
returns text language sql stable security definer set search_path to 'public'
as $$
  select coalesce(
    (select pa.full_name from public.platform_admins pa where pa.auth_user_id = auth.uid()),
    (select s.full_name from public.cbx_staff s where s.auth_user_id = auth.uid()),
    (select p.full_name from public.people p
       join public.holdings h on h.id = p.holding_id
      where p.auth_user_id = auth.uid() and p.is_active and h.is_staff_holding
      order by p.created_at limit 1),
    'desconhecido'
  );
$$;

-- Identidade no portal:
--  master            -> todas as áreas;
--  staff registrado  -> suas permissões;
--  membro CONNBX     -> entra no portal, mas SEM áreas até receber permissões;
--  demais            -> não-staff (404).
create or replace function public.cbx_me()
returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select case
    when app.is_platform_admin() then jsonb_build_object(
      'is_staff', true, 'is_master', true,
      'full_name', app.cbx_actor_name(),
      'permissions', jsonb_build_array('CEO','FINANCEIRO','COMERCIAL','SUPORTE','ADMIN')
    )
    when exists (select 1 from public.cbx_staff s where s.auth_user_id = auth.uid() and s.is_active) then (
      select jsonb_build_object(
        'is_staff', true, 'is_master', false,
        'full_name', s.full_name,
        'permissions', to_jsonb(s.permissions)
      ) from public.cbx_staff s where s.auth_user_id = auth.uid()
    )
    when exists (
      select 1 from public.people p join public.holdings h on h.id = p.holding_id
      where p.auth_user_id = auth.uid() and p.is_active and h.is_staff_holding
    ) then (
      select jsonb_build_object(
        'is_staff', true, 'is_master', false,
        'full_name', p.full_name,
        'permissions', '[]'::jsonb
      ) from public.people p join public.holdings h on h.id = p.holding_id
      where p.auth_user_id = auth.uid() and p.is_active and h.is_staff_holding
      order by p.created_at limit 1
    )
    else jsonb_build_object('is_staff', false)
  end;
$$;
