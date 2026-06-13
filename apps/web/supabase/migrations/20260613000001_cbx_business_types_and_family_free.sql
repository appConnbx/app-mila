-- ============ Tipos de negócio (registro editável) ============
create table if not exists public.cbx_business_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.cbx_business_types enable row level security;

insert into public.cbx_business_types (name) values
  ('Construção civil'),('Engenharia'),('Arquitetura'),('Incorporação imobiliária'),
  ('Imobiliária'),('Varejo'),('Atacado'),('E-commerce'),('Indústria'),
  ('Logística e transporte'),('Agronegócio'),('Saúde e clínicas'),('Educação'),
  ('Tecnologia / Software'),('Serviços financeiros'),('Contabilidade'),
  ('Advocacia / Jurídico'),('Marketing e publicidade'),('Consultoria'),
  ('Alimentação / Restaurantes'),('Hotelaria / Turismo'),('Energia'),
  ('Telecomunicações'),('Automotivo'),('Beleza e estética'),('Eventos'),
  ('ONG / Terceiro setor'),('Setor público'),('Família / Pessoal'),('Outro')
on conflict (name) do nothing;

create or replace function public.cbx_list_business_types(p_all boolean default false)
returns table(id uuid, name text, is_active boolean)
language sql stable security definer set search_path to 'public'
as $$
  select b.id, b.name, b.is_active from public.cbx_business_types b
  where app.is_cbx_staff() and (p_all or b.is_active)
  order by b.name;
$$;

create or replace function public.cbx_add_business_type(p_name text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
begin
  if not (app.cbx_has_permission('COMERCIAL') or app.cbx_has_permission('ADMIN')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if btrim(coalesce(p_name,'')) = '' then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  insert into public.cbx_business_types (name) values (btrim(p_name))
  on conflict (name) do update set is_active = true;
  perform app.cbx_audit('tipo_negocio_add', btrim(p_name), '{}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.cbx_remove_business_type(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_name text;
begin
  if not (app.cbx_has_permission('COMERCIAL') or app.cbx_has_permission('ADMIN')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  delete from public.cbx_business_types where id = p_id returning name into v_name;
  if v_name is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  perform app.cbx_audit('tipo_negocio_remove', v_name, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;

-- ============ Family Free (1 usuário, 15 demandas/dia) ============
alter table public.plans add column if not exists daily_demand_limit integer;

insert into public.plans
  (name, slug, description, provider, account_kind, max_users, included_users, price_cents, currency, billing_interval, daily_demand_limit, is_active)
values
  ('Family Free', 'family-free', 'Plano gratuito — 1 usuário, até 15 demandas por dia', 'manual', 'family', 1, 1, 0, 'BRL', 'free', 15, true)
on conflict (slug) do update set daily_demand_limit = excluded.daily_demand_limit, max_users = excluded.max_users;

-- Limite diário de criação de demandas (fuso America/Sao_Paulo).
create or replace function app.enforce_daily_demand_limit()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
declare lim integer; used integer;
begin
  select p.daily_demand_limit into lim
  from public.subscriptions s join public.plans p on p.id = s.plan_id
  where s.holding_id = new.holding_id and s.status in ('trialing','active')
  order by s.created_at desc limit 1;
  if lim is null then return new; end if;
  select count(*) into used from public.demands
  where holding_id = new.holding_id
    and (created_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date;
  if used >= lim then
    raise exception 'Limite diário de % demandas do plano gratuito atingido. Tente novamente amanhã ou faça upgrade.', lim;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_demands_daily_limit on public.demands;
create trigger trg_demands_daily_limit
  before insert on public.demands
  for each row execute function app.enforce_daily_demand_limit();

-- Provisionamento do cadastro gratuito (chamado só pelo servidor/service_role).
-- Documento (CPF/identificação) guardado em holdings.tax_id; país no profile.
create or replace function public.provision_family_free(
  p_name text, p_email text, p_auth_user_id uuid, p_document text, p_country text
)
returns jsonb language plpgsql security definer set search_path to 'public', 'app'
as $$
declare v_holding uuid; v_org uuid; v_person uuid; v_plan uuid; v_slug text;
begin
  select id into v_plan from public.plans where slug = 'family-free';
  if v_plan is null then return jsonb_build_object('ok', false, 'reason', 'plan_missing'); end if;

  if exists (select 1 from public.holdings where tax_id = p_document and tax_id is not null) then
    return jsonb_build_object('ok', false, 'reason', 'document_exists');
  end if;

  v_slug := btrim(left(regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'), 24), '-');
  v_slug := coalesce(nullif(v_slug, ''), 'familia') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.holdings (name, slug, kind, status, billing_email, contact_email, tax_id)
  values (btrim(p_name), v_slug, 'family', 'active', p_email, p_email, p_document)
  returning id into v_holding;

  insert into public.organizations (holding_id, name, slug)
  values (v_holding, btrim(p_name), v_slug) returning id into v_org;

  insert into public.subscriptions (holding_id, plan_id, provider, status, buyer_email, seats)
  values (v_holding, v_plan, 'manual', 'active', p_email, 1);

  insert into public.people (holding_id, organization_id, full_name, email, auth_user_id, can_delegate)
  values (v_holding, v_org, btrim(p_name), p_email, p_auth_user_id, true)
  returning id into v_person;

  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
  values (v_holding, v_person, 'holding_admin', 'holding', v_holding);

  insert into public.cbx_client_profiles (holding_id, country, updated_by)
  values (v_holding, nullif(p_country,''), 'cadastro gratuito')
  on conflict (holding_id) do nothing;

  return jsonb_build_object('ok', true, 'holding_id', v_holding);
end;
$$;

-- Cadastro gratuito não pode ser disparado por usuários anônimos/autenticados
-- via PostgREST; só pelo servidor (service_role).
revoke execute on function public.provision_family_free(text, text, uuid, text, text) from anon, authenticated;
