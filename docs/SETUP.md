# Etapa 1 — Preparação do ambiente (checklist)

Guia para configurar a máquina **do zero** (Windows 11) e aplicar o banco. Siga na ordem.

## 1. Ferramentas a instalar

Hoje a máquina tem **Git**, mas **falta Node, pnpm e Supabase CLI**.

- [ ] **Node.js LTS (>= 20)** — recomendo via [fnm](https://github.com/Schniz/fnm) ou instalador oficial.
      Verificar: `node -v`
- [ ] **pnpm**: `npm install -g pnpm` → `pnpm -v`
- [ ] **Supabase CLI**: `npm install -g supabase` → `supabase --version`
- [ ] **Docker Desktop** (necessário para rodar o Supabase **local**). Alternativa: usar só a nuvem.
- [ ] **VS Code** + extensões recomendadas (o VS Code sugere ao abrir o projeto; ver `.vscode/extensions.json`).

## 2. Contas a criar

- [ ] **GitHub** — repositório privado `app-mila`
- [ ] **Supabase** — projeto `mila-dev` (região: South America / São Paulo)
- [ ] **Vercel** — conta conectada ao GitHub
- [ ] **Meta for Developers** — WhatsApp Cloud API (fase WhatsApp)
- [ ] **Anthropic** — chave da Claude API (fase WhatsApp)

## 3. Configurar o Git

```powershell
git config --global user.name "Olivaldo Filho"
git config --global user.email "eu@olivaldo.com.br"
git config --global init.defaultBranch main
```

## 4. Variáveis de ambiente

```powershell
Copy-Item .env.example .env.local
```
Preencha com as chaves do Supabase (Dashboard > Project Settings > API).
**Nunca** comite `.env*` (já está no `.gitignore`).

## 5. Instalar dependências do projeto

```powershell
pnpm install
```

## 6. Aplicar o banco

**Opção A — Local (com Docker):**
```powershell
supabase init        # se ainda não houver supabase/config.toml
supabase start       # sobe Postgres + Studio local
supabase db reset    # aplica migrations + seed de exemplo
```
Abra o Supabase Studio local (URL exibida no terminal) e veja as tabelas e dados.

**Opção B — Nuvem (sem Docker):**
```powershell
supabase login
supabase link --project-ref <REF_DO_PROJETO>
supabase db push     # aplica as migrations no projeto da nuvem
```
> O `seed.sql` roda automaticamente apenas no `db reset` (local). Para popular a nuvem, rode o conteúdo do seed manualmente no SQL Editor, se desejar.

## 7. Gerar os tipos TypeScript do banco (após aplicar)

```powershell
pnpm db:types        # grava packages/supabase/src/database.types.ts
```

## 8. Cuidados importantes

- [ ] `SUPABASE_SERVICE_ROLE_KEY` e `ANTHROPIC_API_KEY` **jamais** em variáveis `NEXT_PUBLIC_*` ou no app mobile.
- [ ] RLS já vem **habilitado** em todas as tabelas — não desative.
- [ ] Cada mudança de schema = **uma nova migration** (nunca editar migration já aplicada).
- [ ] Primeiro commit só depois de confirmar que `.env*` está ignorado.

## Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `pnpm install` | instala dependências |
| `pnpm db:reset` | recria o banco local com seed |
| `pnpm db:push` | aplica migrations na nuvem |
| `pnpm db:types` | regenera os tipos do banco |
| `pnpm dev` | sobe os apps em desenvolvimento (após Etapa 4) |
