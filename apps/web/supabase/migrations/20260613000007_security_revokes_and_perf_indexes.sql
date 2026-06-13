-- (Segurança) provision_family_free e provision_sponsored_family são chamadas só
-- pelo servidor (admin/service_role). Revogar de anon/authenticated evita que um
-- usuário logado auto-provisione contas grátis/patrocinadas via PostgREST.
revoke all on function public.provision_family_free(text, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.provision_family_free(text, text, uuid, text, text) to service_role;

revoke all on function public.provision_sponsored_family(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.provision_sponsored_family(uuid, text, text, uuid) to service_role;

-- (Performance) índices que faltavam para as queries mais quentes.
create index if not exists idx_demands_resp_status_completed
  on public.demands (responsible_id, status, completed_at);
create index if not exists idx_demands_holding_status
  on public.demands (holding_id, status);
create index if not exists idx_subscriptions_ext_tx
  on public.subscriptions (external_transaction) where external_transaction is not null;
