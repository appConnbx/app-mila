-- ============================================================================
-- APP MILA — Migration 0011: Provisionamento Hotmart + guard de assinatura
--   - public.holding_has_active_access(): wrapper sem args (instância ativa)
--   - public.provision_from_hotmart(): cria holding+org+assinatura+admin numa
--     transação, idempotente por external_subscription_code. Chamado pelo
--     webhook (service_role) após inviteUserByEmail criar o auth.users.id.
-- ============================================================================

-- Wrapper público do guard (chamável via rpc pelo app autenticado)
create or replace function public.holding_has_active_access()
returns boolean language sql stable security definer set search_path = public, app as $$
  select app.holding_has_active_access(app.current_holding_id());
$$;
grant execute on function public.holding_has_active_access() to authenticated, service_role;

-- Provisionamento atômico a partir de uma compra aprovada na Hotmart.
-- p_plan_id é resolvido no Node (por external_product_id + offer). p_auth_user_id
-- vem do inviteUserByEmail. Idempotente: se a assinatura já existe, reativa e retorna.
create or replace function public.provision_from_hotmart(
  p_plan_id uuid,
  p_external_subscription_code text,
  p_buyer_email text,
  p_buyer_name text,
  p_auth_user_id uuid,
  p_current_period_end timestamptz default null,
  p_external_transaction text default null
) returns jsonb
language plpgsql security definer set search_path = public, app as $$
declare
  v_existing public.subscriptions%rowtype;
  v_kind  app.account_kind;
  v_seats integer;
  v_holding uuid;
  v_org uuid;
  v_person uuid;
  v_sub uuid;
  v_name text;
  v_slug text;
begin
  if p_external_subscription_code is null or btrim(p_external_subscription_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_subscription_code');
  end if;

  -- Idempotência: assinatura já provisionada → reativa e retorna a holding.
  select * into v_existing from public.subscriptions
    where external_subscription_code = p_external_subscription_code
    limit 1;
  if found then
    update public.subscriptions
      set status = 'active',
          current_period_end = coalesce(p_current_period_end, current_period_end),
          canceled_at = null,
          updated_at = now()
      where id = v_existing.id;
    update public.holdings set status = 'active' where id = v_existing.holding_id;
    return jsonb_build_object('ok', true, 'holding_id', v_existing.holding_id,
                              'subscription_id', v_existing.id, 'reactivated', true);
  end if;

  select account_kind, coalesce(included_users, max_users)
    into v_kind, v_seats
    from public.plans where id = p_plan_id;
  if v_kind is null then
    return jsonb_build_object('ok', false, 'reason', 'plan_not_found');
  end if;

  v_name := coalesce(nullif(btrim(p_buyer_name), ''), split_part(p_buyer_email, '@', 1));
  v_slug := btrim(left(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), 28), '-');
  v_slug := coalesce(nullif(v_slug, ''), 'conta') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.holdings (name, slug, kind, status, billing_email, contact_email)
    values (v_name, v_slug, v_kind, 'active', p_buyer_email, p_buyer_email)
    returning id into v_holding;

  insert into public.organizations (holding_id, name, slug)
    values (v_holding, v_name, v_slug)
    returning id into v_org;

  -- Assinatura ANTES da pessoa (o trigger de assentos consulta a assinatura ativa).
  insert into public.subscriptions
    (holding_id, plan_id, provider, status, external_subscription_code, external_transaction, buyer_email, current_period_end, seats)
    values (v_holding, p_plan_id, 'hotmart', 'active', p_external_subscription_code, p_external_transaction, p_buyer_email, p_current_period_end, v_seats)
    returning id into v_sub;

  insert into public.people (holding_id, organization_id, full_name, email, auth_user_id, can_delegate)
    values (v_holding, v_org, v_name, p_buyer_email, p_auth_user_id, true)
    returning id into v_person;

  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
    values (v_holding, v_person, 'holding_admin', 'holding', v_holding);

  return jsonb_build_object('ok', true, 'holding_id', v_holding,
                            'subscription_id', v_sub, 'person_id', v_person);
end;
$$;
grant execute on function public.provision_from_hotmart(uuid, text, text, text, uuid, timestamptz, text) to service_role;

-- Lookup de auth.users.id por e-mail (usado pelo webhook quando o comprador já existe).
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
grant execute on function public.auth_user_id_by_email(text) to service_role;

-- ----------------------------------------------------------------------------
-- Guard de acesso com grace period (substitui a definição da migração 0004):
--  - active/trialing: vale enquanto current_period_end é null ou futuro.
--  - canceled/past_due: vale só até current_period_end (período já pago).
--  - suspended/expired (reembolso/chargeback): corta o acesso imediatamente.
-- ----------------------------------------------------------------------------
create or replace function app.holding_has_active_access(_holding uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.holding_id = _holding
      and (
        (s.status in ('active','trialing')
           and (s.current_period_end is null or s.current_period_end > now()))
        or
        (s.status in ('canceled','past_due')
           and s.current_period_end is not null and s.current_period_end > now())
      )
  );
$$;
