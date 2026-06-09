# Roadmap — APP MILA

## Etapas

| Etapa | Entrega | Estado |
|---|---|---|
| 1 | Ambiente + contas + estrutura do projeto | Estrutura pronta; falta instalar Node/pnpm/Supabase CLI (ver `SETUP.md`) |
| 3 | Banco de dados (schema + RLS + seed) | **Entregue p/ validação** (`supabase/migrations/`) |
| 2 | Protótipos de tela | Pendente (pode rodar em paralelo) |
| 4 | Interface web (cadastros + gestão) | Pendente |
| 5 | Input de demandas por WhatsApp (texto → áudio) | Pendente |
| 6 | App mobile Android/iOS | Pendente |
| 7 | Evolução SaaS: webhook Hotmart (provisionar/suspender), onboarding self-service, monitoramento | Banco pronto; código pendente |
| 8 | Portal do Negócio CONNBX (`apps/admin`): métricas globais, engajamento, impersonação de suporte | Banco pronto (platform_admins); código pendente |

## Pontos em aberto (negócio)

- Faixas intermediárias do corporativo (ex.: 35 usuários) — regra de cobrança a definir. Default: contratar o pacote que cobre os assentos.

> A Etapa 3 (banco) foi antecipada à 2 porque é a fundação; protótipos podem correr em paralelo.

## Ordem de implementação da web (Etapa 4)

1. Auth + layout + RLS ponta a ponta
2. Cadastro: organização → área → equipe → pessoa
3. Cadastro de demanda (avulsa)
4. Lista + detalhe de demanda (status, observações, histórico)
5. Eventos (abrir/fechar sessão, vínculo, % conclusão)
6. Gestão pessoal
7. Gestão de equipe / área / organização
8. Indicadores e talentos

## Método de trabalho

- **Branches**: `main` (sempre deployável) ← PR ← `feature/<nome>`. Sem commit direto em `main`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Deploy**: push em `main` → Vercel; preview deploy por PR.
- **Banco**: cada mudança = nova migration; `db:types` após aplicar.
