# 01 — Inteligência do Claude Code

Como levar o "cérebro" do projeto (padrões, skills, conhecimento) para a conta/máquina nova, para o Claude Code trabalhar com o mesmo contexto.

## 1. CLAUDE.md (guia do repo)
Vem no próprio repositório, na raiz (`CLAUDE.md`). Define comandos, stack, domínio (holding/demanda), regras inegociáveis (RLS, segredos no servidor, webhooks idempotentes, tema por tokens, i18n, portal /cbx secreto) e fluxo de trabalho. Ao clonar o repo, ele já vem junto — nenhum segredo nele.

## 2. Skills de engenharia — plugin `connbx-saas`
As 5 skills (product-architect, software-engineer, security-engineer, qa-engineer, ux-engineer) **não** moram neste repo: estão no repositório **`connbx-engineering`** (marketplace privado do Claude Code), distribuídas como o plugin `connbx-saas`.

Para habilitar na conta/máquina nova (uma vez):
```
/plugin marketplace add https://github.com/<sua-conta>/connbx-engineering
/plugin install connbx-saas@connbx
```
Ou, para valer em TODOS os projetos da máquina, em `~/.claude/settings.json`:
```json
"extraKnownMarketplaces": {
  "connbx": { "source": { "source": "github", "repo": "<sua-conta>/connbx-engineering" } }
},
"enabledPlugins": { "connbx-saas@connbx": true }
```
Os skills passam a responder como `connbx-saas:saas-*`. Padrões de arquitetura (decisões, módulos reusáveis) estão em `connbx-engineering/standards/`.

> Se for recriar numa conta GitHub nova, leve também o repo `connbx-engineering` (ele é a base de conhecimento) — clone-o para a conta nova e ajuste a URL acima.

## 3. Documentação do produto (no repo)
Fonte da verdade da arquitetura e do domínio, tudo em `docs/`:
- `docs/ARQUITETURA.md` — decisões técnicas (D1–D10), princípios, diagrama.
- `docs/MODELO_DADOS.md` — tabelas, hierarquia, RLS, cobrança.
- `docs/INFRAESTRUTURA.md` — mapa de DNS/host/banco/e-mail/pagamentos (contém identificadores do ambiente ANTIGO — trate como referência; a conta nova terá os seus).
- `docs/SETUP.md` — checklist de instalação e comandos.
- `docs/ROADMAP.md` — etapas.

## 4. Conhecimento destilado (o que não está no código)
Decisões e armadilhas aprendidas que vale o Claude saber ao recriar:
- **Multi-tenant**: tenant = `holding` (`kind` corporate|family); instância ativa via cookie `mila_holding` → header `x-holding-id` → `app.current_holding_id()` que **revalida no banco** (nunca confiar no cookie cru).
- **RLS**: habilitada + otimizada — `(select auth.uid())` nas policies, índice em toda coluna de policy, sem joins (usar `in (select …)`), 1 policy por ação. RPCs `SECURITY DEFINER` com gate na 1ª linha + `set search_path` + lockdown de grants (revogar `anon`/`public`).
- **Webhooks de pagamento**: assinatura + idempotência (`provider, external_event_id`) + status conservador (desconhecido → sem acesso).
- **Concorrência**: optimistic lock (`.eq('status', from)`); autoria por coluna (`author_kind`), não por nome.
- **Tema/ i18n**: tokens de cor (sem cores fixas; cuidado com variantes `hover:`); pt-BR/en/es; fuso da instância nos agrupamentos.
- **Portal /cbx**: secreto — 404 para não-staff, noindex, sem links em nenhuma superfície.
- **Agente desktop (Tauri)**: build/release por CI (tag `agent-v*`), auto-update; modo Store (MSIX) sem updater.
- **Gotcha supabase-js**: tipos gerados podem resolver queries como `never` — castar com `as unknown as T` quando preciso.
- **Tooling**: Biome (lint+format), `pnpm verify` = `biome check + turbo typecheck`, CI gate; `.gitattributes` com `eol=lf`.

> Se você usa a memória do Claude Code (`~/.claude/.../memory/`), ela é por-máquina e não vai no repo. O essencial acima já cobre o que importa para recriar; os arquivos de memória podem ser copiados à parte se quiser manter o histórico de decisões.
