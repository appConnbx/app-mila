# APP MILA

> MILA transforma demandas soltas, reuniões e decisões em execução organizada.

Plataforma de gestão de demandas, eventos e produtividade, com entrada por **web**, **mobile** e **WhatsApp**. Arquitetura multiempresa (multi-tenant) desde o início, preparada para evoluir como SaaS.

## Stack

| Camada | Tecnologia |
|---|---|
| Web | Next.js 15 + TypeScript + Tailwind + shadcn/ui (Vercel) |
| Mobile | Expo / React Native + TypeScript |
| Banco / Auth | Supabase (Postgres + RLS + Auth) |
| WhatsApp | Meta Cloud API + Claude API (interpretação) |
| Monorepo | Turborepo + pnpm |

## Estrutura

```
app-mila/
├─ apps/
│  ├─ web/        # Next.js — app dos clientes (Etapa 4)
│  ├─ mobile/     # Expo (Etapa 6)
│  └─ admin/      # Portal do Negócio CONNBX (Etapa 8)
├─ packages/
│  ├─ shared/     # regras de negócio + Zod (Etapa 4)
│  └─ supabase/   # cliente + tipos do banco (Etapa 4)
├─ supabase/
│  ├─ migrations/ # >>> schema do banco (PRONTO p/ revisão) <<<
│  └─ seed.sql    # dados de exemplo (Grupo Ribeiro Caram)
└─ docs/          # documentação do projeto
```

## Documentação

- [`docs/SETUP.md`](docs/SETUP.md) — **comece aqui**: instalação do ambiente (Etapa 1)
- [`docs/MODELO_DADOS.md`](docs/MODELO_DADOS.md) — modelo de dados (entidades, RLS, regras)
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — decisões técnicas e justificativas
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — plano de execução por etapas

## Estado atual

Etapa 3 (banco) entregue para validação. As migrations em `supabase/migrations/` criam as tabelas do domínio + a fundação de SaaS/billing (Hotmart), tudo com RLS multiempresa. Próximo: instalar o ambiente (`docs/SETUP.md`) e aplicar o banco.
