-- Provisionamento define o idioma da conta pela moeda do plano:
-- USD (internacional) -> 'en'; BRL (brasileiro) -> 'pt-BR'. O admin pode trocar depois.
create or replace function public.provision_subscription(
  p_plan_id uuid,
  p_provider app.billing_provider,
  p_external_subscription_code text,
  p_buyer_email text,
  p_buyer_name text,
  p_auth_user_id uuid,
  p_current_period_end timestamptz default null,
  p_external_transaction text default null
) returns jsonb
language plpgsql security definer set search_path to 'public','app'
as $$
declare
  v_existing public.subscriptions%rowtype;
  v_kind  app.account_kind;
  v_seats integer;
  v_currency text;
  v_lang text;
  v_holding uuid; v_org uuid; v_person uuid; v_sub uuid;
  v_name text; v_slug text;
begin
  if p_external_subscription_code is null or btrim(p_external_subscription_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_subscription_code');
  end if;

  select * into v_existing from public.subscriptions
    where external_subscription_code = p_external_subscription_code limit 1;
  if found then
    update public.subscriptions
      set status = 'active',
          current_period_end = coalesce(p_current_period_end, current_period_end),
          canceled_at = null, updated_at = now()
      where id = v_existing.id;
    update public.holdings set status = 'active' where id = v_existing.holding_id;
    return jsonb_build_object('ok', true, 'holding_id', v_existing.holding_id,
                              'subscription_id', v_existing.id, 'reactivated', true);
  end if;

  select account_kind, coalesce(included_users, max_users), currency
    into v_kind, v_seats, v_currency from public.plans where id = p_plan_id;
  if v_kind is null then
    return jsonb_build_object('ok', false, 'reason', 'plan_not_found');
  end if;
  v_lang := case when upper(coalesce(v_currency, '')) = 'USD' then 'en' else 'pt-BR' end;

  v_name := coalesce(nullif(btrim(p_buyer_name), ''), split_part(p_buyer_email, '@', 1));
  v_slug := btrim(left(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), 28), '-');
  v_slug := coalesce(nullif(v_slug, ''), 'conta') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.holdings (name, slug, kind, status, billing_email, contact_email, language)
    values (v_name, v_slug, v_kind, 'active', p_buyer_email, p_buyer_email, v_lang)
    returning id into v_holding;

  insert into public.organizations (holding_id, name, slug)
    values (v_holding, v_name, v_slug) returning id into v_org;

  insert into public.subscriptions
    (holding_id, plan_id, provider, status, external_subscription_code, external_transaction, buyer_email, current_period_end, seats)
    values (v_holding, p_plan_id, p_provider, 'active', p_external_subscription_code, p_external_transaction, p_buyer_email, p_current_period_end, v_seats)
    returning id into v_sub;

  insert into public.people (holding_id, organization_id, full_name, email, auth_user_id, can_delegate)
    values (v_holding, v_org, v_name, p_buyer_email, p_auth_user_id, true)
    returning id into v_person;

  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
    values (v_holding, v_person, 'holding_admin', 'holding', v_holding);

  return jsonb_build_object('ok', true, 'holding_id', v_holding,
                            'subscription_id', v_sub, 'person_id', v_person);
end; $$;

revoke all on function public.provision_subscription(uuid, app.billing_provider, text, text, text, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.provision_subscription(uuid, app.billing_provider, text, text, text, uuid, timestamptz, text) to service_role;

-- O próprio usuário (admin da holding) define o idioma da conta.
create or replace function public.set_my_language(p_lang text)
returns void language plpgsql security definer set search_path to 'public','app' as $$
begin
  if p_lang not in ('pt-BR', 'en', 'es') then return; end if;
  update public.holdings h set language = p_lang, updated_at = now()
  where exists (
    select 1 from public.memberships m
    join public.people pe on pe.id = m.person_id
    where pe.auth_user_id = auth.uid() and m.role = 'holding_admin' and m.scope_id = h.id
  );
end; $$;
grant execute on function public.set_my_language(text) to authenticated;
