# MILA Android — Plano de release (app oficial)

> TL;DR: o app Expo já funciona (login, criar demanda por voz, lista, deep link, i18n, tema escuro). Este plano leva-o a **publicado na Play Store**. O código e o pipeline já estão preparados — falta só (a) você criar 2 contas e 2 segredos **uma vez**, e (b) **executar** (rodar o build/submeter). Identificador do app: `co.appmila.mobile`.

## 1. Estado atual (o que já existe em `apps/mobile`)
- **Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript.
- **Auth:** Supabase (sessão em `expo-secure-store`), mesma conta do web/agente.
- **Voz:** `expo-audio` (segure-e-fale, 10s) → `/api/agent/transcribe` (autenticado) → cria demanda.
- **Telas:** Login, Home (lista com polling 20s), Record (gravador). Deep link `mila://record`.
- **i18n:** `expo-localization` (pt-BR/en/es). **Tema escuro** (cyan #22D3EE).
- **Build:** `eas.json` com profiles development/preview/production + submit.

## 2. Arquitetura (alinhada ao ecossistema)
- **Mesmo backend Supabase** (RLS/RPCs) — segurança no banco; chaves do app são públicas (`anon`).
- **Mesma identidade visual** do web/agente (tema escuro, brand cyan).
- **Multi-instância:** o app deve respeitar o conceito de instância ativa (holding). Hoje a Home assume a padrão; ver §4 (seletor de instância) para paridade total.

## 3. Requisitos para "oficial" na Play Store
- `versionCode` inteiro incremental (EAS `autoIncrement` cuida) e `version` semântica (1.0.0). ✅ definido.
- **AAB** (Android App Bundle) assinado — o EAS gera e gerencia o **keystore** automaticamente (não precisa criar à mão). ✅ profile `production` = `app-bundle`.
- **Política de privacidade** (URL): usar `https://www.appmila.co/privacy`. ✅ já existe.
- **Data safety form** no Play Console: declarar coleta de e-mail (auth), áudio (transcrição — não armazenado), e que dados não são vendidos.
- **Permissões:** apenas `RECORD_AUDIO` + `INTERNET` (já restritas no app.json; `SYSTEM_ALERT_WINDOW` bloqueada).
- **Ícone adaptativo:** hoje usa `icon.png` como foreground. Ideal: foreground com margem segura (safe zone ~66%) para não cortar no círculo/squircle. Trocar `assets/` antes do release final.
- **Listagem:** título, descrição curta/longa, screenshots (mín. 2 telefone), feature graphic 1024×500.

## 4. Backlog de paridade/qualidade (priorizado)
- **[Alta] Seletor de instância** (se o usuário tiver +1 holding) — espelhar `my_instances`/`enterInstance`.
- **[Alta] Onboarding de membro no 1º acesso** (espelha `/welcome-member`): o que dá pra fazer + tema/uso.
- **[Média] Push notifications** (`expo-notifications`): aviso de nova demanda/atribuição. Exige `google-services.json` (FCM) + plugin. Fica para v1.1.
- **[Média] Tema claro** seguindo a preferência do SO (paridade com o web).
- **[Média] Estado de erro/empty/loading** consistentes (skeleton); feedback em toda ação (já é o padrão do produto).
- **[Baixa] Deep link universal** `https://go.appmila.co` (App Links) — intent filter já declarado; exige `assetlinks.json` no domínio (ver §7).
- **[Baixa] Acessibilidade:** labels/`accessibilityLabel` nos botões de ícone; alvo de toque ≥48dp.

## 5. Fases de execução
1. **Pré-voo (uma vez):** contas + segredos (ver §6). `eas init` no `apps/mobile`.
2. **Build interno (preview/APK):** validar em aparelho real (login, voz→demanda, deep link, i18n).
3. **Backlog Alta** (seletor de instância + onboarding de membro) → novo build interno.
4. **Build de produção (AAB)** via tag `mobile-v1.0.0` → CI EAS.
5. **Faixa interna** no Play → testers → faixa fechada/aberta → **produção**.
6. **v1.1:** push notifications + tema claro + App Links.

## 6. Pré-requisitos que SÓ VOCÊ faz (uma vez — não dá por código)
1. **Conta Expo** (expo.dev) → Account → **Access Tokens** → criar token → salvar como secret **`EXPO_TOKEN`** no GitHub (Settings → Secrets → Actions). *(Criar conta/segredo é ação de conta — por isso é com você.)*
2. **`eas init`** dentro de `apps/mobile` (vincula o projeto e grava `extra.eas.projectId` no `app.json`). Requer login Expo.
3. **Google Play Console** (conta de desenvolvedor, taxa única US$25) → criar o app `co.appmila.mobile`.
4. **Service Account** (Google Cloud) com acesso ao Play → baixar o **JSON** → configurar no EAS (`eas credentials` ou `submit.production.android.serviceAccountKeyPath`) para o `eas submit` funcionar.

## 7. Como EXECUTAR (depois do pré-voo, é só isto)
- **Teste em aparelho (APK):** `eas build -p android --profile preview` → instalar o APK gerado.
- **Release de produção (AAB):** `git tag mobile-v1.0.0 && git push origin mobile-v1.0.0` → a CI (`.github/workflows/mobile-build.yml`) builda na nuvem do EAS. Ou rode o workflow manual escolhendo `production` (+ marcar "submit" para enviar à faixa internal do Play).
- **Submeter manualmente:** `eas submit -p android --profile production --latest`.
- **App Links (go.appmila.co):** publicar `/.well-known/assetlinks.json` no domínio com o SHA-256 do app (o EAS mostra o fingerprint após o build). Opcional para v1.0.

## 8. O que já foi preparado neste repo
- `app.json`: versão **1.0.0**, `versionCode 1`, permissões mínimas, intent filter de App Links, cor primária da marca.
- `eas.json`: produção = **AAB**; preview/dev = **APK**; submit em faixa **internal** (`draft`).
- `.github/workflows/mobile-build.yml`: build (e submit opcional) por **tag `mobile-v*`** ou manual.
- Este plano + runbook.

## 9. Riscos / notas
- O `eas submit` precisa do Service Account do Play (passo §6.4) — sem ele, só o **build** roda; a publicação é manual no console com o AAB baixado.
- Ícone adaptativo: revisar a safe-zone antes do release público (evita corte do logo).
- Push (v1.1) muda o escopo de privacidade (declarar no Data Safety).
