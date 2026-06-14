-- (1) Bucket de avatares: impor limite de tamanho e MIME (evita upload arbitrario/grande).
update storage.buckets
   set file_size_limit = 2 * 1024 * 1024,
       allowed_mime_types = array['image/png','image/jpeg','image/webp']
 where id = 'avatars';

-- (2) Travar EXECUTE das funcoes public: anon NAO chama RPC (fluxos anonimos usam
-- service_role); authenticated mantem (o app depende, e cada RPC sensivel tem gate
-- interno). CREATE OR REPLACE em migrations anteriores re-concedia o default a PUBLIC
-- -> aqui consolidamos e travamos o default para o futuro.
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on all functions in schema public from anon, public;
alter default privileges in schema public revoke execute on functions from public;

-- Funcoes server-only (sem gate proprio; so service_role) — re-revoga de authenticated.
revoke execute on function public.provision_family_free(text, text, uuid, text, text) from authenticated;
revoke execute on function public.provision_sponsored_family(uuid, text, text, uuid) from authenticated;
revoke execute on function public.auth_user_id_by_email(text) from authenticated;
revoke execute on function public.provision_from_hotmart(uuid, text, text, text, uuid, timestamptz, text) from authenticated;
revoke execute on function public.provision_subscription(uuid, app.billing_provider, text, text, text, uuid, timestamptz, text) from authenticated;
