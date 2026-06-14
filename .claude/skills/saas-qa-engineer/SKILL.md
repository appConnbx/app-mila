---
name: saas-qa-engineer
description: Engenheiro de QA para SaaS multi-tenant. Use para rodar uma bateria de testes por fluxo, encontrar falhas/edge cases e problemas de UX/UI, e pontuar risco × probabilidade. Inclui checklist e um modelo de relatório. Baseado nos achados do AppMila.
---

# QA Engineer — bateria de testes e relatório

Objetivo: mapear os fluxos a partir do código, exercitar cada um contra um checklist, e entregar um relatório priorizado por **severidade × probabilidade**. Não invente; cite `arquivo:linha`.

## Fluxos a cobrir (SaaS típico)
Signup/primeiro acesso · onboarding admin · onboarding membro · login/troca de instância · CRUD do objeto central + transições de estado · delegação/compartilhamento · suporte (cliente abre/responde/fecha; back-office atende com nota interna vs interação) · billing/renovação · back-office (comercial, suporte, indicadores).

## Checklist por fluxo (rode em cada um)
- **Estados:** loading, vazio, erro, sucesso, sem permissão, offline. Cada um existe e é claro?
- **Dados nulos/limite:** nome/e-mail ausente, listas vazias, texto gigante (cap server-side?), datas nulas.
- **Concorrência:** dois usuários no mesmo objeto (last-write-wins? aviso?). Duplo-submit (botão sem pending → duplicação?).
- **Erro real vs genérico:** mensagens técnicas cruas vazando (ex.: erro do provider em inglês)? Erro "genérico" escondendo causas distintas?
- **Idempotência:** webhooks e ações que provisionam — reprocessar é seguro?
- **Multi-tenant:** dados de outra instância podem vazar? (defesa em profundidade: filtrar por tenant além do RLS).
- **i18n:** strings faltando em pt/en/es? Conteúdo hardcoded (países, planos)?
- **Timezone:** agrupamentos por mês/dia usam o fuso da instância ou do server?
- **Métricas derivadas:** "estimado" rotulado? ignora cancelado/suspenso? mistura moedas?

## Checklist de UX/UI
- Feedback de toda ação (flash de sucesso/erro). `return` silencioso em server action = usuário sem saber por quê.
- Confirmação em ações destrutivas (excluir pessoa/estrutura/dados).
- Consistência de componentes (todos os submits usam o botão com pending? todas as listas seguem o padrão de tabela?).
- **Tema light:** cores fixas (`text-white`, `bg-slate-900/x`, `border-white/10`) ficam ilegíveis no claro — auditar COM o tema light ativo. Variantes `hover:` não são cobertas por overrides.
- **Acessibilidade:** `label htmlFor`/`id`, `aria-label` em ícones-botão, focus-trap + `Esc` em modais/drawers, `role`/`aria` em gráficos, contraste.
- Mobile/responsivo: tabelas com scroll, modais, toolbars.
- Promessas cumpridas: CTA "baixar app mobile" leva à loja, não à home.

## Pontuação (risco × probabilidade)
Severidade: Alta (perda de dado/acesso/dinheiro, bloqueio) · Média (fluxo degradado, confusão) · Baixa (cosmético). Probabilidade: Alta/Média/Baixa. Priorize Alta×Alta. Para cada item: `[SEV][PROB] título — arquivo:linha — descrição — correção sugerida`.

## Modelo de relatório
1. **TL;DR (3–5 linhas):** os achados mais impactantes.
2. **Por fluxo:** lista priorizada com arquivo:linha.
3. **Transversais:** itens que afetam tudo (tema light, return silencioso, acessibilidade, timezone).
4. **Tabela top-10** (item, sev, arquivo:linha).
5. **Ressalva metodológica:** o que NÃO foi verificado (ex.: lógica em RPCs/RLS não lidas → "confia em RLS" é alerta de defesa em profundidade, não falha confirmada).

## Achados recorrentes (catálogo do AppMila — procure análogos)
- Tela de criar senha não detecta sessão ausente/token expirado → erro cru.
- Status inline last-write-wins sem refletir estado do servidor.
- Query da lista sem filtro de tenant explícito (só RLS).
- Webhook: status desconhecido → acesso; reembolso parcial somado nunca suspende.
- Onboarding multi-holding: mostra só a 1ª pendente mas conclui todas.
- Preço duplicado entre tela de renovação e fonte única → divergência.
- "Faturado estimado" contando cancelados; total mistura BRL/USD.
- Reload por `setTimeout` fixo após ação (corrida).
- Senha mínima divergente entre fluxos (4 vs 6 vs 8).
