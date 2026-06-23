-- Security hardening a partir do advisor do Supabase (2026-06-23).

-- 1) anon não deve executar RPCs ligadas a sessão (no-op sem login). O EXECUTE
--    vinha de PUBLIC (default do CREATE FUNCTION) — por isso revoga-se de PUBLIC
--    e regranta-se aos papéis corretos.
revoke execute on function public.accept_terms() from public;
revoke execute on function public.agent_pending_demands() from public;
grant execute on function public.accept_terms() to authenticated, service_role;
grant execute on function public.agent_pending_demands() to authenticated, service_role;

-- 2) Bucket público "avatars": impõe limite de tamanho e tipos de imagem
--    (evita upload arbitrário; mitiga abuso do bucket público).
update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'avatars';
