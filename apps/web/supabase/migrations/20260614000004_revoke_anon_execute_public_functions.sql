-- Seguranca: nenhum fluxo anonimo chama RPC (cadastro publico usa service_role;
-- demais RPCs exigem sessao autenticada). Remove o EXECUTE explicito de anon nas
-- funcoes do schema public. 'authenticated' mantem acesso (o app depende).
-- Reversivel via grant. As funcoes server-only sensiveis (provision_*, enumeracao
-- por e-mail) ja estavam revogadas de anon/authenticated em migrations anteriores.
revoke execute on all functions in schema public from anon;
