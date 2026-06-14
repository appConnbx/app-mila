---
name: saas-product-architect
description: Arquiteto de produto para SaaS multi-tenant B2B/B2C. Use ao planejar um sistema novo (ou um módulo) — decompõe em áreas (admin do negócio, admin do cliente, suporte, onboarding, billing, licenciamento, cortesia) e define o modelo de dados, papéis e fluxos antes de codar. Destila os padrões do AppMila.
---

# Arquiteto de Produto — SaaS multi-tenant

Pense no produto ANTES da tela. Comece pela conclusão: que negócio é, quem são os atores, e qual o "objeto central". Só então módulos, dados e fluxos.

## 1. Modelo mental que escala (do AppMila)
- **Conta (login) ≠ Instância.** Um usuário (auth) pode pertencer a **várias instâncias** (holdings) — empresas E sua família. Ele alterna entre elas; é DENTRO de uma instância que o trabalho acontece. Modele isso desde o dia 1: `auth.users` → `people` (uma por instância) → `memberships` (papel por escopo).
- **Tenant = holding**, com `kind` (`corporate` | `family`). O mesmo código serve segmentos diferentes mudando só conteúdo/estrutura, não o core.
- **Hierarquia corporativa:** holding → organizações → áreas → equipes → pessoas. Família: holding → pessoas (sem org/área), incluindo funcionários da casa.
- **Objeto central** (no AppMila, "demanda/tarefa"). Tudo orbita ele. Defina-o e suas transições de estado cedo (ex.: nova → trabalhando → finalizada).

## 2. As áreas de todo SaaS sério (checklist)
1. **Admin do negócio (back-office / "CBX")** — só sua equipe. Comercial (clientes, planos, licença, faturamento), Suporte (fila de tickets), CEO/Financeiro (indicadores), governança/auditoria. Portal **separado e discreto** (rota secreta, 404 para não-staff, noindex).
2. **Admin do cliente** — o dono da instância configura: dados, logo, fuso, idioma, estrutura (org/área/equipe ou membros), usuários, licença visível, suporte.
3. **Suporte** — tickets que o cliente abre e o back-office atende. Comentários com **audiência** (nota interna vs interação visível ao cliente). Alerta de não-lida. Cliente pode fechar.
4. **Onboarding** — dois tipos: **admin** (1º acesso, foco em configuração, trilha por segmento) e **membro** (1º acesso, foco em uso + instalar apps). Gate por flag (`onboarding_done` na holding; `member_onboarding_done` na pessoa).
5. **Integração de e-mail** — convite/primeiro acesso ("crie sua senha"), notificações. Decida cedo: e-mail de auth (Supabase/provider) vs transacional (Resend). Allowlist de redirect URLs.
6. **Integração de pagamentos** — múltiplos provedores por mercado (ex.: Hotmart BR, Stripe INTL). Webhook com **assinatura + idempotência**. Provisionamento via service_role.
7. **Licenciamento** — plano → limites (assentos, limite diário). Licença manual, **VIP/cortesia** (ilimitado/vitalício), trial. Separe "plano" (catálogo) de "assinatura" (instância) de "licença efetiva".
8. **Cortesia/comp e venda manual** — back-office cria cliente sem gateway, atribui plano/VIP, dispara e-mail de acesso.

## 3. Decisões de arquitetura que se pagam
- **Fonte única de verdade** para preços/planos/ofertas (um módulo). Nunca duplique preço em telas.
- **RLS desde o início** (ver skill de segurança). Escopo por tenant validado no banco, não só no app.
- **i18n e tema desde o início** se houver mercado internacional. Tokens semânticos de cor (não cores fixas) para suportar dark/light sem retrabalho.
- **Apps complementares** (mobile, agente desktop) entram cedo no modelo: autenticam pela mesma conta, falam com os mesmos endpoints, têm onboarding próprio.
- **"Estimado" nunca vira "real".** Métrica derivada (ex.: faturado estimado) deve ser rotulada e só contar estados válidos (assinatura ativa). Receita real exige capturar o `amount` do pagamento.

## 4. Como conduzir (processo)
1. Mapeie atores e o objeto central. 2. Liste as 8 áreas e marque quais entram no MVP. 3. Desenhe o ERD mínimo (tenant, pessoas, papéis, objeto central, billing). 4. Defina papéis e o que cada um vê/faz. 5. Liste os fluxos críticos (signup→primeiro acesso, trocar instância, criar/atribuir objeto, abrir ticket, renovar). 6. Para cada fluxo, defina os estados de erro/edge ANTES de codar. 7. Só então implemente — fatia vertical por fluxo, não por camada.

## 5. Armadilhas recorrentes (vistas no AppMila)
- Gate de acesso/onboarding **encadeando redirects** (server action → layout) gera tela branca: decida o destino em UM redirect.
- Backfill ao adicionar flags (`onboarding_done`, etc.): marque registros existentes para não disromper clientes atuais.
- Excluir dados de teste: confirme escopo, use cascade do FK, proteja contas compartilhadas/staff.
- "Família Olivaldo" problem: distinga dados de teste dos reais antes de apagar.
