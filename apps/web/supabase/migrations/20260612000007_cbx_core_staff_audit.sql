-- Portal CBX (back-office CONNBX): equipe, permissões e auditoria.
-- Acesso às tabelas só via RPCs SECURITY DEFINER (RLS ligado, sem policies).

create table if not exists public.cbx_staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cbx_staff_perms_valid
    check (permissions <@ array['CEO','FINANCEIRO','COMERCIAL','SUPORTE','ADMIN']::text[])
);
alter table public.cbx_staff enable row level security;

create table if not exists public.cbx_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_auth_id uuid,
  actor_name text,
  action text not null,
  target text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.cbx_audit_log enable row level security;
create index if not exists idx_cbx_audit_created on public.cbx_audit_log (created_at desc);

-- Staff ativo OU master (platform_admins). Master nunca entra em cbx_staff.
create or replace function app.is_cbx_staff()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select app.is_platform_admin() or exists (
    select 1 from public.cbx_staff s where s.auth_user_id = auth.uid() and s.is_active
  );
$$;

create or replace function app.cbx_has_permission(p_perm text)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select app.is_platform_admin() or exists (
    select 1 from public.cbx_staff s
    where s.auth_user_id = auth.uid() and s.is_active and p_perm = any(s.permissions)
  );
$$;

create or replace function app.cbx_actor_name()
returns text language sql stable security definer set search_path to 'public'
as $$
  select coalesce(
    (select pa.full_name from public.platform_admins pa where pa.auth_user_id = auth.uid()),
    (select s.full_name from public.cbx_staff s where s.auth_user_id = auth.uid()),
    'desconhecido'
  );
$$;

create or replace function app.cbx_audit(p_action text, p_target text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path to 'public'
as $$
  insert into public.cbx_audit_log (actor_auth_id, actor_name, action, target, details)
  values (auth.uid(), app.cbx_actor_name(), p_action, p_target, coalesce(p_details, '{}'::jsonb));
$$;

-- Identidade do operador no portal (o guard do layout usa isto).
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
    else jsonb_build_object('is_staff', false)
  end;
$$;

-- Gestão de equipe (guard ADMIN). Master jamais aparece ou é alterado.
create or replace function public.cbx_list_staff()
returns table(id uuid, full_name text, email text, permissions text[], is_active boolean, created_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select s.id, s.full_name, s.email, s.permissions, s.is_active, s.created_at
  from public.cbx_staff s
  where app.cbx_has_permission('ADMIN')
    and not exists (select 1 from public.platform_admins pa where pa.auth_user_id = s.auth_user_id)
  order by s.is_active desc, s.full_name;
$$;

create or replace function public.cbx_register_staff(p_auth uuid, p_name text, p_email text, p_perms text[])
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
begin
  if not app.cbx_has_permission('ADMIN') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if exists (select 1 from public.platform_admins pa where pa.auth_user_id = p_auth) then
    return jsonb_build_object('ok', false, 'reason', 'master_untouchable');
  end if;
  insert into public.cbx_staff (auth_user_id, full_name, email, permissions)
  values (p_auth, p_name, p_email, p_perms)
  on conflict (auth_user_id) do update
    set full_name = excluded.full_name, email = excluded.email,
        permissions = excluded.permissions, is_active = true, updated_at = now();
  perform app.cbx_audit('staff_registrado', p_email, jsonb_build_object('permissoes', p_perms));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.cbx_set_staff(p_id uuid, p_perms text[], p_active boolean)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_email text;
begin
  if not app.cbx_has_permission('ADMIN') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  select email into v_email from public.cbx_staff s
   where s.id = p_id
     and not exists (select 1 from public.platform_admins pa where pa.auth_user_id = s.auth_user_id);
  if v_email is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  update public.cbx_staff
     set permissions = p_perms, is_active = p_active, updated_at = now()
   where id = p_id;
  perform app.cbx_audit('staff_atualizado', v_email,
    jsonb_build_object('permissoes', p_perms, 'ativo', p_active));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.cbx_list_audit(p_limit int default 200)
returns table(id uuid, actor_name text, action text, target text, details jsonb, created_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select a.id, a.actor_name, a.action, a.target, a.details, a.created_at
  from public.cbx_audit_log a
  where app.cbx_has_permission('ADMIN')
  order by a.created_at desc
  limit least(coalesce(p_limit, 200), 500);
$$;
