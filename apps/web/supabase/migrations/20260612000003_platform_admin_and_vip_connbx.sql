-- Super-admin de plataforma (dono do SaaS / CONNBX) e licença VIP CONNBX.

-- is_platform_admin(): super-admin global, fora do escopo de holding.
create or replace function app.is_platform_admin()
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.auth_user_id = auth.uid()
  );
$$;

-- Cadastra Olivaldo (dono) como platform admin.
insert into public.platform_admins (auth_user_id, full_name)
values ('ad0c68ff-6be8-4f0d-b965-849ea2349b26', 'Olivaldo Serafim Filho')
on conflict (auth_user_id) do nothing;

-- Planos VIP CONNBX: vitalícios, ilimitados (max_users NULL => o trigger de
-- assentos libera sem teto). Um por tipo de conta para casar account_kind.
insert into public.plans
  (name, slug, description, provider, account_kind, max_users, included_users, price_cents, currency, billing_interval, is_active)
values
  ('VIP CONNBX', 'vip-connbx-corporate', 'Licença vitalícia CONNBX — usuários ilimitados (corporativo)', 'manual', 'corporate', null, null, 0, 'BRL', 'lifetime', true),
  ('VIP CONNBX', 'vip-connbx-family',    'Licença vitalícia CONNBX — usuários ilimitados (família)',    'manual', 'family',    null, null, 0, 'BRL', 'lifetime', true)
on conflict (slug) do nothing;
