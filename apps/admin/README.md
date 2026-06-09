# apps/admin — Portal do Negócio (CONNBX)

Painel interno da CONNBX (dona do produto), separado do app dos clientes.

**Ainda não gerado.** Etapa de SaaS. Funções previstas:
- Métricas globais: nº de holdings e famílias contratadas, usuários por instância, atividades registradas e finalizadas, receita.
- Gráficos de uso e engajamento por cliente.
- **Acesso de suporte**: assumir uma instância de cliente como administrador (impersonação), via mecanismo `platform_admins` + header `x-holding-id`.

Acesso restrito a `platform_admins`. Métricas globais rodam no servidor com `service_role` (cross-tenant); impersonação respeita o controle de acesso assumindo a holding-alvo.
