-- ===== VIP CONNBX FAMILY: plano família patrocinado pelo colaborador corporativo =====
-- Família com até 10 usuários, gratuito, atrelado a um usuário corporativo ativo.
insert into public.plans
  (name, slug, description, provider, account_kind, max_users, included_users, price_cents, currency, billing_interval, daily_demand_limit, is_active)
values
  ('VIP CONNBX FAMILY', 'connbx-family-sponsored',
   'Benefício familiar do plano corporativo — até 10 usuários, enquanto o colaborador estiver ativo na empresa',
   'manual', 'family', 10, 10, 0, 'BRL', 'free', null, true)
on conflict (slug) do update set max_users = excluded.max_users, daily_demand_limit = excluded.daily_demand_limit;

-- Vínculo da assinatura família patrocinada ao colaborador corporativo (sponsor).
alter table public.subscriptions
  add column if not exists sponsor_person_id uuid references public.people(id) on delete set null;

-- Acesso da holding: janela de assinatura + (para VIP FAMILY) sponsor corporativo ativo.
create or replace function app.holding_has_active_access(_holding uuid)
returns boolean
language plpgsql stable security definer set search_path to 'public'
as $function$
declare
  v_status text;
  v_period timestamptz;
  v_sponsor uuid;
  v_slug text;
  v_window boolean;
begin
  select s.status::text, s.current_period_end, s.sponsor_person_id, pl.slug
    into v_status, v_period, v_sponsor, v_slug
  from public.subscriptions s
  left join public.plans pl on pl.id = s.plan_id
  where s.holding_id = _holding
  order by s.created_at desc
  limit 1;

  if v_status is null then
    return false;
  end if;

  v_window :=
    (v_status in ('active','trialing') and (v_period is null or v_period > now()))
    or (v_status in ('canceled','past_due') and v_period is not null and v_period > now());

  if not v_window then
    return false;
  end if;

  -- VIP CONNBX FAMILY: só vale enquanto o colaborador patrocinador estiver ativo
  -- e a conta corporativa dele com acesso. Sponsor nulo (ex.: excluído) => sem acesso.
  if v_slug = 'connbx-family-sponsored' then
    return exists (
      select 1 from public.people sp
      where sp.id = v_sponsor and sp.is_active
        and app.holding_has_active_access(sp.holding_id)
    );
  end if;

  return true;
end;
$function$;

-- Provisiona a conta família patrocinada (service_role; chamada pelo servidor).
create or replace function public.provision_sponsored_family(
  p_sponsor_person uuid, p_name text, p_email text, p_auth_user_id uuid
)
returns jsonb language plpgsql security definer set search_path to 'public', 'app'
as $$
declare
  v_plan uuid; v_holding uuid; v_org uuid; v_person uuid; v_slug text; v_kind app.account_kind;
  v_existing uuid;
begin
  select id into v_plan from public.plans where slug = 'connbx-family-sponsored';
  if v_plan is null then return jsonb_build_object('ok', false, 'reason', 'plan_missing'); end if;

  select h.kind into v_kind
  from public.people pe join public.holdings h on h.id = pe.holding_id
  where pe.id = p_sponsor_person and pe.is_active;
  if v_kind is distinct from 'corporate' then
    return jsonb_build_object('ok', false, 'reason', 'sponsor_invalid');
  end if;

  select s.holding_id into v_existing
  from public.subscriptions s join public.plans pl on pl.id = s.plan_id
  where s.sponsor_person_id = p_sponsor_person and pl.slug = 'connbx-family-sponsored'
  limit 1;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'holding_id', v_existing, 'existed', true);
  end if;

  v_slug := btrim(left(regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'), 24), '-');
  v_slug := coalesce(nullif(v_slug, ''), 'familia') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.holdings (name, slug, kind, status, billing_email, contact_email)
  values (btrim(p_name), v_slug, 'family', 'active', p_email, p_email)
  returning id into v_holding;

  insert into public.organizations (holding_id, name, slug)
  values (v_holding, btrim(p_name), v_slug) returning id into v_org;

  insert into public.subscriptions (holding_id, plan_id, provider, status, buyer_email, seats, sponsor_person_id)
  values (v_holding, v_plan, 'manual', 'active', p_email, 10, p_sponsor_person);

  insert into public.people (holding_id, organization_id, full_name, email, auth_user_id, can_delegate)
  values (v_holding, v_org, btrim(p_name), p_email, p_auth_user_id, true)
  returning id into v_person;

  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
  values (v_holding, v_person, 'holding_admin', 'holding', v_holding);

  return jsonb_build_object('ok', true, 'holding_id', v_holding, 'existed', false);
end;
$$;
revoke execute on function public.provision_sponsored_family(uuid, text, text, uuid) from anon, authenticated;

-- Para o perfil: dados do colaborador logado (se corporativo) + se já tem família patrocinada.
create or replace function public.my_sponsored_family_status()
returns jsonb language sql stable security definer set search_path to 'public', 'app'
as $$
  select jsonb_build_object(
    'person_id', app.current_person_id(),
    'is_corporate', (select kind = 'corporate' from public.holdings where id = app.current_holding_id()),
    'family_holding', (
      select s.holding_id from public.subscriptions s
      join public.plans pl on pl.id = s.plan_id
      where pl.slug = 'connbx-family-sponsored' and s.sponsor_person_id = app.current_person_id()
      limit 1
    )
  );
$$;

-- ===== CBX: gestão de usuários da instância do cliente (super admin) =====
create or replace function public.cbx_holding_users(p_holding uuid)
returns table(id uuid, full_name text, email text, role_title text, is_active boolean, is_admin boolean, has_login boolean, last_sign_in_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select pe.id, pe.full_name, pe.email, pe.role_title, pe.is_active,
    exists (select 1 from public.memberships m where m.person_id = pe.id and m.role = 'holding_admin' and m.scope_id = pe.holding_id),
    (pe.auth_user_id is not null),
    u.last_sign_in_at
  from public.people pe
  left join auth.users u on u.id = pe.auth_user_id
  where app.is_cbx_staff() and pe.holding_id = p_holding and not pe.is_ghost
  order by pe.is_active desc, pe.full_name;
$$;

create or replace function public.cbx_set_person_active(p_person uuid, p_active boolean)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_email text;
begin
  if not (app.cbx_has_permission('SUPORTE') or app.cbx_has_permission('COMERCIAL')) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  update public.people set is_active = p_active, updated_at = now() where id = p_person returning email into v_email;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  perform app.cbx_audit(case when p_active then 'usuario_reativado' else 'usuario_desativado' end, coalesce(v_email,'(sem e-mail)'),
    jsonb_build_object('person_id', p_person));
  return jsonb_build_object('ok', true);
end;
$$;

-- Retorna o auth_user_id de uma pessoa (para o reset de senha via service_role).
create or replace function public.cbx_person_auth(p_person uuid)
returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select case when app.cbx_has_permission('SUPORTE') or app.cbx_has_permission('COMERCIAL')
    then (select jsonb_build_object('auth_user_id', pe.auth_user_id, 'email', pe.email)
          from public.people pe where pe.id = p_person)
    else jsonb_build_object('forbidden', true) end;
$$;
