# Infraestrutura — APP MILA (onde está cada coisa)

> Mapa de domínio, DNS, hospedagem, banco, e-mails e pagamentos.
> Complementa o `ARQUITETURA.md` (decisões técnicas). Última atualização: 2026-06-14.

## Visão geral

```
                          ┌──────────────────────────┐
  Cliente / navegador  →  │  www.appmila.co (VERCEL)  │  ← app Next.js (este repo, apps/web)
                          └─────────────┬─────────────┘
                                        │ usa
                          ┌─────────────▼─────────────┐
                          │  SUPABASE (Postgres + Auth │  ← banco, RLS, Edge Functions
                          │  + Storage + Edge Funcs)   │     projeto: jqgdexxydtsbcebgvyvh
                          └────────────────────────────┘

  Domínio appmila.co  →  registrado e com DNS na GODADDY (ns01/ns02.domaincontrol.com)
       Todos os registros DNS (Vercel, HostGator, Resend) são editados NA GODADDY.

  E-mail RECEBER  (help@appmila.co)         →  HOSTGATER  (registro MX da raiz)
  E-mail ENVIAR   (boas-vindas, transac.)   →  RESEND     (subdomínio send.appmila.co + DKIM)
       Receber e enviar são independentes e coexistem no mesmo domínio.

  Pagamentos:   Internacional → STRIPE    |    Brasil + afiliados → HOTMART
```

## 1. Domínio e DNS — GoDaddy

- **Registrador e DNS:** GoDaddy. Nameservers: `ns01.domaincontrol.com`, `ns02.domaincontrol.com`.
- **Regra de ouro:** todo registro DNS novo (de qualquer serviço) é colado em **GoDaddy → DNS → Manage DNS** do `appmila.co`.

### Estado atual dos registros
| Tipo | Nome | Valor | Função |
|---|---|---|---|
| A | @ | 76.76.21.21 | site (Vercel, apex) |
| CNAME | www | cname.vercel-dns.com | site (Vercel, www) |
| NS | @ | ns01/ns02.domaincontrol.com | DNS na GoDaddy |
| MX | @ | _(vazio)_ | a configurar → HostGator |
| TXT | @ | _(vazio)_ | a configurar → SPF/DKIM |

### A adicionar
| Tipo | Nome | Valor | Função | Origem do valor |
|---|---|---|---|---|
| MX | @ | host de e-mail HostGator | receber e-mail | cPanel HostGator |
| A | mail | IP do servidor HostGator | mail.appmila.co | cPanel HostGator |
| (vários) | send / resend._domainkey | gerados pelo Resend | enviar (DKIM/SPF) | painel Resend |

> O MX da **raiz** vai para a HostGator (recebimento). O Resend usa um **subdomínio** (`send.appmila.co`) — não conflita com o MX da raiz. Por isso convivem.

## 2. App web — Vercel
- Deploy automático a cada `git push origin main`. Código: `apps/web` (Next.js 15).
- Variáveis de ambiente (Vercel → Settings → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `STRIPE_SECRET_KEY` (sk_live), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `APP_BASE_URL=https://www.appmila.co`, `HOTMART_HOTTOK`

## 3. Banco / Auth / Functions — Supabase
- Projeto `jqgdexxydtsbcebgvyvh`. Postgres + RLS multi-tenant. Migrations em `apps/web/supabase/migrations/`.
- Auth e-mail/senha; primeiro acesso: convite → `/auth/confirm` → `/create-password`.
- Idioma da conta em `holdings.language` (definido pela moeda do plano na compra).
- **Send Email Hook** (Edge Function) envia o e-mail de boas-vindas no idioma da conta, via Resend.

## 4. E-mail
### Receber — HostGator
- Caixa `help@appmila.co` criada no cPanel. `appmila.co` adicionado ao cPanel (Addon Domain) só para e-mail.
- MX da raiz (na GoDaddy) aponta para o servidor de e-mail da HostGator.

### Enviar — Resend
- Conta Resend (free 3.000/mês). Domínio `appmila.co` verificado por DNS (DKIM/SPF) na GoDaddy.
- Remetente: `no-reply@appmila.co`. Respostas vão para a caixa HostGator (`help@appmila.co`).

## 5. Pagamentos
- **Stripe** — internacional (USD). Webhook `/api/stripe/webhook`, portal `/api/stripe/portal`, gate `/subscribe`.
- **Hotmart** — Brasil (`P106262837P`, anual/12x) + afiliados (`Y106267582L`). Webhook `/api/hotmart/webhook`.
- Provisionamento unificado: `provision_subscription(provider, …)`.

## 6. Responsabilidades
| Item | Onde | Quem faz |
|---|---|---|
| Registros DNS | GoDaddy | Usuário (com orientação) |
| Deploy do app | Vercel (`git push`) | Usuário |
| Migrations / Edge Functions | Supabase (MCP) | Claude |
| Caixa de e-mail (receber) | HostGator cPanel | Usuário |
| Verificação de envio (DNS) | Resend + GoDaddy | Usuário (DNS) + Claude (integração) |
| Chaves/segredos | Vercel / Supabase | Usuário insere os valores |
