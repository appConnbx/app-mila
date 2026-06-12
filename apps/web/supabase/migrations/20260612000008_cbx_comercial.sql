-- Área Comercial do portal CBX: enriquecimento de cadastro, notas,
-- criação manual de cliente e licenciamento manual.

create table if not exists public.cbx_client_profiles (
  holding_id uuid primary key references public.holdings(id) on delete cascade,
  business_type text,
  country text,
  state text,
  city text,
  contact_name text,
  contact_email text,
  contact_phone text,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.cbx_client_profiles enable row level security;

create table if not exists public.cbx_client_notes (
  id uuid primary key default gen_random_uuid(),
  holding_id uuid not null references public.holdings(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.cbx_client_notes enable row level security;
create index if not exists idx_cbx_notes_holding on public.cbx_client_notes (holding_id, created_at desc);

-- Lista de clientes (qualquer operador do portal pode consultar).
create or replace function public.cbx_list_clients()
returns table(
  holding_id uuid, name text, kind text, holding_status text,
  plan_id uuid, plan_name text, seat_limit integer, used integer,
  is_unlimited boolean, sub_status text, provider text,
  business_type text, city text, state text, country text,
  contact_name text, created_at timestamptz
)
language sql stable security definer set search_path to 'public'
as $$
  select
    h.id, h.name, h.kind::text, h.status::text,
    pl.id, pl.name,
    coalesce(s.seats, pl.max_users),
    (select count(*)::int from public.people pe where pe.holding_id = h.id and pe.is_active),
    (s.id is not null and coalesce(s.seats, pl.max_users) is null),
    s.status::text, s.provider::text,
    cp.business_type, cp.city, cp.state, cp.country, cp.contact_name,
    h.created_at
  from public.holdings h
  left join lateral (
    select * from public.subscriptions ss
    where ss.holding_id = h.id and ss.status in ('trialing','active')
    order by ss.created_at desc limit 1
  ) s on true
  left join public.plans pl on pl.id = s.plan_id
  left join public.cbx_client_profiles cp on cp.holding_id = h.id
  where app.is_cbx_staff()
  order by h.name;
$$;

-- Ficha completa de um cliente.
create or replace function public.cbx_client_detail(p_holding uuid)
returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select case when not app.is_cbx_staff() then jsonb_build_object('ok', false) else
  jsonb_build_object(
    'ok', true,
    'holding', (select jsonb_build_object(
        'id', h.id, 'name', h.name, 'kind', h.kind, 'status', h.status,
        'legal_name', h.legal_name, 'tax_id', h.tax_id,
        'contact_email', h.contact_email, 'phone', h.phone,
        'billing_email', h.billing_email, 'created_at', h.created_at)
      from public.holdings h where h.id = p_holding),
    'license', (select jsonb_build_object(
        'plan_id', pl.id, 'plan_name', pl.name, 'provider', s.provider,
        'status', s.status, 'seats', s.seats, 'max_users', pl.max_users,
        'seat_limit', coalesce(s.seats, pl.max_users),
        'is_unlimited', coalesce(s.seats, pl.max_users) is null,
        'current_period_end', s.current_period_end,
        'external_subscription_code', s.external_subscription_code)
      from public.subscriptions s
      left join public.plans pl on pl.id = s.plan_id
      where s.holding_id = p_holding and s.status in ('trialing','active')
      order by s.created_at desc limit 1),
    'used', (select count(*)::int from public.people pe
             where pe.holding_id = p_holding and pe.is_active),
    'profile', (select to_jsonb(cp.*) from public.cbx_client_profiles cp
                where cp.holding_id = p_holding),
    'notes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', n.id, 'author', n.author_name, 'body', n.body, 'created_at', n.created_at)
        order by n.created_at desc)
      from (select * from public.cbx_client_notes
            where holding_id = p_holding order by created_at desc limit 50) n), '[]'::jsonb)
  ) end;
$$;

create or replace function public.cbx_upsert_client_profile(
  p_holding uuid, p_business_type text, p_country text, p_state text, p_city text,
  p_contact_name text, p_contact_email text, p_contact_phone text
)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
begin
  if not app.cbx_has_permission('COMERCIAL') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  insert into public.cbx_client_profiles
    (holding_id, business_type, country, state, city, contact_name, contact_email, contact_phone, updated_by)
  values (p_holding, nullif(p_business_type,''), nullif(p_country,''), nullif(p_state,''), nullif(p_city,''),
          nullif(p_contact_name,''), nullif(p_contact_email,''), nullif(p_contact_phone,''), app.cbx_actor_name())
  on conflict (holding_id) do update set
    business_type = excluded.business_type, country = excluded.country,
    state = excluded.state, city = excluded.city,
    contact_name = excluded.contact_name, contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    updated_by = excluded.updated_by, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.cbx_add_client_note(p_holding uuid, p_body text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
begin
  if not (app.cbx_has_permission('COMERCIAL') or app.cbx_has_permission('SUPORTE')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if btrim(coalesce(p_body, '')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;
  insert into public.cbx_client_notes (holding_id, author_name, body)
  values (p_holding, app.cbx_actor_name(), btrim(p_body));
  return jsonb_build_object('ok', true);
end;
$$;

-- Criação manual de cliente (espelha provision_from_hotmart; provider manual).
create or replace function public.cbx_create_client(
  p_name text, p_kind app.account_kind, p_plan_id uuid,
  p_admin_email text, p_admin_name text, p_auth_user_id uuid,
  p_seats integer default null
)
returns jsonb language plpgsql security definer set search_path to 'public', 'app'
as $$
declare
  v_holding uuid; v_org uuid; v_person uuid; v_sub uuid;
  v_slug text; v_plan_kind app.account_kind;
begin
  if not app.cbx_has_permission('COMERCIAL') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  select account_kind into v_plan_kind from public.plans where id = p_plan_id;
  if v_plan_kind is null then
    return jsonb_build_object('ok', false, 'reason', 'plan_not_found');
  end if;
  if v_plan_kind <> p_kind then
    return jsonb_build_object('ok', false, 'reason', 'plan_kind_mismatch');
  end if;

  v_slug := btrim(left(regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'), 28), '-');
  v_slug := coalesce(nullif(v_slug, ''), 'conta') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.holdings (name, slug, kind, status, billing_email, contact_email)
  values (btrim(p_name), v_slug, p_kind, 'active', p_admin_email, p_admin_email)
  returning id into v_holding;

  insert into public.organizations (holding_id, name, slug)
  values (v_holding, btrim(p_name), v_slug)
  returning id into v_org;

  -- Assinatura antes da pessoa (trigger de assentos consulta a assinatura).
  insert into public.subscriptions (holding_id, plan_id, provider, status, buyer_email, seats)
  values (v_holding, p_plan_id, 'manual', 'active', p_admin_email, p_seats)
  returning id into v_sub;

  insert into public.people (holding_id, organization_id, full_name, email, auth_user_id, can_delegate)
  values (v_holding, v_org, coalesce(nullif(btrim(p_admin_name),''), split_part(p_admin_email,'@',1)),
          p_admin_email, p_auth_user_id, true)
  returning id into v_person;

  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
  values (v_holding, v_person, 'holding_admin', 'holding', v_holding);

  perform app.cbx_audit('cliente_criado', p_name,
    jsonb_build_object('holding_id', v_holding, 'plano', p_plan_id, 'admin', p_admin_email));
  return jsonb_build_object('ok', true, 'holding_id', v_holding, 'person_id', v_person);
end;
$$;

-- Licenciamento manual: agora também para staff COMERCIAL (não só master) + auditoria.
create or replace function public.admin_set_license(p_holding uuid, p_plan_id uuid, p_seats integer default null)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare
  existing uuid;
  prov app.billing_provider;
  v_plan_name text;
  v_holding_name text;
begin
  if not (app.is_platform_admin() or app.cbx_has_permission('COMERCIAL')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select provider, name into prov, v_plan_name from public.plans where id = p_plan_id;
  if prov is null then
    return jsonb_build_object('ok', false, 'reason', 'plan_not_found');
  end if;
  select name into v_holding_name from public.holdings where id = p_holding;

  select id into existing from public.subscriptions
   where holding_id = p_holding and status in ('trialing','active')
   order by created_at desc limit 1;

  if existing is null then
    insert into public.subscriptions (holding_id, plan_id, provider, status, seats, current_period_end, canceled_at)
    values (p_holding, p_plan_id, prov, 'active', p_seats, null, null);
  else
    update public.subscriptions
       set plan_id = p_plan_id, provider = prov, status = 'active', seats = p_seats,
           current_period_end = null, canceled_at = null, updated_at = now()
     where id = existing;
  end if;

  update public.holdings set status = 'active' where id = p_holding and status <> 'active';
  perform app.cbx_audit('licenca_alterada', v_holding_name,
    jsonb_build_object('holding_id', p_holding, 'plano', v_plan_name, 'seats', p_seats));
  return jsonb_build_object('ok', true);
end;
$$;

-- Planos selecionáveis: qualquer staff do portal.
create or replace function public.admin_list_plans()
returns table(id uuid, name text, account_kind text, provider text, max_users integer, price_cents integer, currency text, slug text)
language sql stable security definer set search_path to 'public'
as $$
  select p.id, p.name, p.account_kind::text, p.provider::text, p.max_users, p.price_cents, p.currency, p.slug
  from public.plans p
  where app.is_cbx_staff() and p.is_active
  order by (p.provider = 'manual') desc, p.account_kind, p.price_cents nulls first;
$$;
