# 03 — Integrações (o que criar na conta nova)

Cada serviço externo, para que serve, as variáveis (só nomes) e **onde obter**. Nenhum valor aqui — a conta nova gera os seus.

| Serviço | Para quê | Variáveis (nomes) | Onde obter / configurar |
|---|---|---|---|
| **Supabase** | Banco, Auth, Storage, Edge Functions | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secreta), `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Project Settings → API |
| **Vercel** | Hospedagem do web (`apps/web`) | — (lê as env acima) | Conecta o repo GitHub; deploy no push `main` |
| **Claude API (Anthropic)** | NLP das mensagens (voz/WhatsApp) | `ANTHROPIC_API_KEY` (secreta) | console.anthropic.com → API keys |
| **Stripe** | Pagamento internacional (USD) | `STRIPE_SECRET_KEY` (sk_live), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe → API keys + Webhooks (endpoint `/api/stripe/webhook`); criar os 6 produtos/preços e mapear por `lookup_key`/offer |
| **Hotmart** | Pagamento BR + afiliados | `HOTMART_HOTTOK` (secreta) | Painel Hotmart → criar produto + ofertas; configurar postback/webhook (endpoint `/api/hotmart/webhook`); anotar product/offer ids para popular `plans` |
| **WhatsApp Cloud API (Meta)** | Captura por mensagem | `WHATSAPP_VERIFY_TOKEN` (você define), `WHATSAPP_ACCESS_TOKEN` (secreta), `WHATSAPP_PHONE_NUMBER_ID` | developers.facebook.com → app + número; webhook em `/api/...` |
| **Resend** | Enviar e-mail transacional/boas-vindas | `RESEND_API_KEY` (secreta — **Supabase Edge Function secret**, não `.env` do app) | resend.com → verificar domínio (subdomínio `send.`) por DNS; API key |
| **E-mail (HostGator ou similar)** | Receber (`help@…`) | — (DNS/MX) | cPanel → caixa + MX da raiz no DNS |
| **Domínio + DNS** | `appmila.co` (ou o novo) | — | Registrador (ex.: GoDaddy): A/CNAME p/ Vercel, MX p/ e-mail, TXT/DKIM p/ Resend |
| **GA4 (opcional)** | Analytics | `NEXT_PUBLIC_GA4_ID` | Google Analytics (medida G-…) |
| **App base** | Links de convite | `APP_BASE_URL` (ex.: `https://www.<dominio>`), `NEXT_PUBLIC_SITE_URL` | você define (domínio novo) |

## Onde cada variável vive
- **Vercel → Environment Variables**: todas as `NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `HOTMART_HOTTOK`, `ANTHROPIC_API_KEY`, `WHATSAPP_*`, `APP_BASE_URL`, `NEXT_PUBLIC_SITE_URL`.
- **Supabase → Edge Function secrets**: `RESEND_API_KEY` (usada pela função `send-email`).
- **Mobile (`apps/mobile/.env`)**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Agente (Tauri)**: usa a URL/anon públicas embutidas no build + fala com `APP_BASE_URL`; release/assinatura por CI (secret `TAURI_SIGNING_PRIVATE_KEY` no GitHub Actions).

## Endpoints internos que as integrações chamam (já no código)
- Stripe: `/api/stripe/webhook`, `/api/stripe/portal`, checkout em `/subscribe`.
- Hotmart: `/api/hotmart/webhook` (valida `x-hotmart-hottok`).
- Agente: `/api/agent/transcribe`, `/api/agent/download`.
- Provisionamento unificado no banco: `provision_subscription(provider, …)`.

> **Regra de segurança (mantida):** `service_role` e chaves secretas **só no servidor** — nunca com prefixo `NEXT_PUBLIC_`/`EXPO_PUBLIC_`.
