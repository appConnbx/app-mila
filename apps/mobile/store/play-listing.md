# appMila — Listagem da Google Play Store

Pacote: `co.appmila.mobile` · Versão 1.0.0 (versionCode 1) · Política de privacidade: https://www.appmila.co/privacy

---

## Ficha da loja (pt-BR)

**Nome do app:** appMila

**Descrição curta** (máx. 80 caracteres):
> Capture tarefas por voz e nunca mais perca uma demanda — trabalho e família.

**Descrição completa** (máx. 4000 caracteres):
> O appMila transforma o que é combinado em tarefas organizadas — com responsável, prazo e acompanhamento até concluir. Em vez de anotar (e esquecer), você captura em segundos, até por voz.
>
> • Capture por voz: segure, fale e o appMila registra a demanda para você.
> • Trabalho e vida pessoal na mesma conta: organize a equipe da empresa e também a rotina da família.
> • Acompanhe o andamento: o que está aberto, em andamento e concluído.
> • Sincronizado: o appMila também tem sistema web e agente para computador.
> • Em português, inglês e espanhol.
>
> Pare de perder o que foi combinado na correria. Baixe o appMila e coloque cada demanda no lugar certo.

**Categoria:** Produtividade
**E-mail de contato:** (definir — ex.: suporte@appmila.co)
**Tags/keywords sugeridas:** tarefas, produtividade, lista de tarefas, organização, voz, equipe, família

---

## Data Safety (formulário do Play Console)

- **Coleta de dados:**
  - **E-mail** — coletado, vinculado ao usuário. Finalidade: gestão de conta / funcionalidade do app. Não compartilhado. Não vendido.
  - **Áudio (microfone)** — usado para criar demandas por voz. O áudio é enviado para transcrição e **não é armazenado** (processamento efêmero). Não compartilhado. Não vendido. *(Confirmar com a engenharia como o backend trata o áudio antes de marcar "efêmero" x "coletado".)*
- **Segurança:** dados **criptografados em trânsito** (HTTPS). ✅
- **Exclusão de dados:** o usuário pode solicitar a exclusão da conta/dados (informar canal: suporte@appmila.co). ✅
- **Público infantil:** não direcionado a crianças.

---

## Assets necessários (pendentes — produzir)

- **Ícone:** 512×512 (gerado pelo EAS a partir do app). ✅ ícone adaptativo já configurado.
- **Feature graphic:** 1024×500 (PNG/JPEG). ⏳ produzir.
- **Screenshots de telefone:** mínimo 2 (recomendado 4–6), 16:9 ou 9:16. ⏳ capturar em aparelho/emulador real (Login, Home/lista, Gravação por voz).

---

## Runbook de publicação (ordem)

### Pré-voo (uma vez — ações suas; envolvem conta/pagamento)
1. **Conta Expo** (expo.dev) → Account → Access Tokens → criar token → salvar como secret **`EXPO_TOKEN`** no GitHub (Settings → Secrets and variables → Actions).
2. **`eas init`** dentro de `apps/mobile` (requer login Expo) → grava `extra.eas.projectId` no `app.json`. *(É o único passo que ainda falta no repo.)*
3. **Google Play Console** → criar conta de desenvolvedor (taxa única **US$25**) → criar o app `co.appmila.mobile`.

### Build + 1ª publicação
4. Disparar o build na nuvem do EAS: `git tag mobile-v1.0.0 && git push origin mobile-v1.0.0` (ou rodar o workflow **MILA Mobile — Android (EAS)** manual, perfil `production`). Gera o **AAB** assinado.
5. **1º envio (manual, mais simples):** baixar o AAB do EAS e subir no Play Console → faixa **Teste interno**. Preencher ficha (textos acima), Data Safety, política de privacidade e assets.
6. Adicionar testadores (e-mails) → validar login, voz→demanda, deep link e idiomas em aparelho real.
7. Promover: Teste interno → fechado/aberto → **Produção**.

### Automação do envio (depois, opcional)
8. **Service Account** (Google Cloud) com acesso ao Play → JSON → configurar no EAS. Aí o workflow com `submit: true` envia sozinho à faixa internal.

> Observação: criação de contas e pagamento da taxa são ações suas (não posso criar contas nem inserir pagamento). Eu cuido de toda a parte de código/CI/assets de texto e te guio em cada clique.
