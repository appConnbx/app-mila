// i18n do agente. O idioma vem da configuração da instância (holdings.language):
// em divergência entre instâncias, a CORPORATIVA prevalece. Antes do login,
// usa o último idioma conhecido (localStorage) ou o do sistema.

export type Lang = "pt-BR" | "en" | "es";

const DICT = {
  "pt-BR": {
    pillTitle: "appMila — suas demandas",
    pillMicTitle: "Demanda por voz",
    micTitle: "Demanda por voz",
    micHoldHint: "Segure o botão e fale (até 10s)",
    micTargetTitle: "Onde criar a demanda",
    micRecording: "Gravando… solte para criar.",
    micTranscribing: "Transcrevendo…",
    micCreating: "Criando demanda…",
    micCreated: "✓ Criada",
    micTooShort: "Muito curto — segure enquanto fala.",
    micNotConfigured: "Transcrição ainda não configurada.",
    micFailed: "Não deu certo — tente de novo.",
    micUnavailable: "Microfone indisponível ou sem permissão.",
    micCountdown: "Criando em {s}s — recuse se não ficou bom.",
    micRefuse: "✕ Recusar",
    micAccept: "✓ OK",
    micRefused: "Descartada — grave outra se quiser.",
    loginHint: "Entre com a mesma conta do appMila web.",
    email: "E-mail",
    password: "Senha",
    signIn: "Entrar",
    signingIn: "Entrando…",
    badCredentials: "E-mail ou senha inválidos.",
    newDemand: "Nova demanda…",
    duedateTitle: "Prazo (opcional)",
    createTitle: "Criar demanda",
    createFailed: "Não foi possível criar. Tente novamente.",
    emptyList: "Nenhuma demanda pendente. 🎉",
    chipNew: "nova",
    chipWorking: "em andamento",
    chipHigh: "alta",
    dueOverdue: "atrasada",
    dueToday: "hoje",
    dueTomorrow: "amanhã",
    startWork: "Começar a trabalhar",
    backToNew: "Voltar para nova",
    finish: "Concluir demanda",
    refreshTitle: "Atualizar",
    logoutTitle: "Sair da conta",
    autostart: "Iniciar com o Windows",
    webTip:
      "Para o acesso completo e todas as funcionalidades, use o sistema web. Clique para abrir.",
  },
  en: {
    pillTitle: "appMila — your tasks",
    pillMicTitle: "Voice task",
    micTitle: "Voice task",
    micHoldHint: "Hold the button and speak (up to 10s)",
    micTargetTitle: "Where to create the task",
    micRecording: "Recording… release to create.",
    micTranscribing: "Transcribing…",
    micCreating: "Creating task…",
    micCreated: "✓ Created",
    micTooShort: "Too short — hold while you speak.",
    micNotConfigured: "Voice transcription not configured yet.",
    micFailed: "Didn't work — try again.",
    micUnavailable: "Microphone unavailable or no permission.",
    micCountdown: "Creating in {s}s — discard if it's wrong.",
    micRefuse: "✕ Discard",
    micAccept: "✓ OK",
    micRefused: "Discarded — record another if you like.",
    loginHint: "Sign in with the same appMila web account.",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    badCredentials: "Invalid email or password.",
    newDemand: "New task…",
    duedateTitle: "Due date (optional)",
    createTitle: "Create task",
    createFailed: "Couldn't create. Try again.",
    emptyList: "No pending tasks. 🎉",
    chipNew: "new",
    chipWorking: "in progress",
    chipHigh: "high",
    dueOverdue: "overdue",
    dueToday: "today",
    dueTomorrow: "tomorrow",
    startWork: "Start working",
    backToNew: "Back to new",
    finish: "Finish task",
    refreshTitle: "Refresh",
    logoutTitle: "Sign out",
    autostart: "Start with Windows",
    webTip: "For full access and every feature, use the web app. Click to open.",
  },
  es: {
    pillTitle: "appMila — tus tareas",
    pillMicTitle: "Tarea por voz",
    micTitle: "Tarea por voz",
    micHoldHint: "Mantén el botón y habla (hasta 10s)",
    micTargetTitle: "Dónde crear la tarea",
    micRecording: "Grabando… suelta para crear.",
    micTranscribing: "Transcribiendo…",
    micCreating: "Creando tarea…",
    micCreated: "✓ Creada",
    micTooShort: "Muy corto — mantén mientras hablas.",
    micNotConfigured: "Transcripción aún no configurada.",
    micFailed: "No funcionó — inténtalo de nuevo.",
    micUnavailable: "Micrófono no disponible o sin permiso.",
    micCountdown: "Creando en {s}s — rechaza si no quedó bien.",
    micRefuse: "✕ Rechazar",
    micAccept: "✓ OK",
    micRefused: "Descartada — graba otra si quieres.",
    loginHint: "Entra con la misma cuenta de appMila web.",
    email: "Correo",
    password: "Contraseña",
    signIn: "Entrar",
    signingIn: "Entrando…",
    badCredentials: "Correo o contraseña inválidos.",
    newDemand: "Nueva tarea…",
    duedateTitle: "Plazo (opcional)",
    createTitle: "Crear tarea",
    createFailed: "No se pudo crear. Inténtalo de nuevo.",
    emptyList: "Sin tareas pendientes. 🎉",
    chipNew: "nueva",
    chipWorking: "en curso",
    chipHigh: "alta",
    dueOverdue: "atrasada",
    dueToday: "hoy",
    dueTomorrow: "mañana",
    startWork: "Empezar a trabajar",
    backToNew: "Volver a nueva",
    finish: "Concluir tarea",
    refreshTitle: "Actualizar",
    logoutTitle: "Cerrar sesión",
    autostart: "Iniciar con Windows",
    webTip:
      "Para el acceso completo y todas las funciones, usa el sistema web. Haz clic para abrir.",
  },
} as const;

export type I18nKey = keyof (typeof DICT)["pt-BR"];

let current: Lang = "pt-BR";

export function lang(): Lang {
  return current;
}

export function t(key: I18nKey): string {
  return DICT[current][key];
}

function isLang(v: unknown): v is Lang {
  return v === "pt-BR" || v === "en" || v === "es";
}

/** Idioma antes do login: último conhecido ou o do sistema. */
export function initLang() {
  const saved = localStorage.getItem("mila_lang");
  if (isLang(saved)) {
    current = saved;
    return;
  }
  const sys = navigator.language;
  if (sys.startsWith("pt")) current = "pt-BR";
  else if (sys.startsWith("es")) current = "es";
  else current = "en";
}

/** Aplica o idioma das instâncias: corporativa prevalece. Retorna se mudou. */
export function applyHoldingsLang(holdings: { kind: string; language?: string | null }[]): boolean {
  const corp = holdings.find((h) => h.kind === "corporate");
  const pick = corp?.language ?? holdings[0]?.language;
  if (!isLang(pick) || pick === current) return false;
  current = pick;
  localStorage.setItem("mila_lang", pick);
  return true;
}

/** Tradução dos textos estáticos do HTML. */
export function applyStatic() {
  const set = (id: string, fn: (el: HTMLElement) => void) => {
    const el = document.getElementById(id);
    if (el) fn(el);
  };
  set("pill-top", (el) => (el.title = t("pillTitle")));
  set("pill-mic", (el) => (el.title = t("pillMicTitle")));
  set("hold-btn", (el) => (el.title = t("pillMicTitle")));
  set("mic-holding", (el) => (el.title = t("micTargetTitle")));
  set("mic-reject", (el) => (el.textContent = t("micRefuse")));
  set("mic-accept", (el) => (el.textContent = t("micAccept")));
  document.querySelector(".mic-title")!.textContent = t("micTitle");
  set("login-email", (el) => ((el as HTMLInputElement).placeholder = t("email")));
  set("login-password", (el) => ((el as HTMLInputElement).placeholder = t("password")));
  set("login-btn", (el) => (el.textContent = t("signIn")));
  document.querySelector(".login-hint")!.textContent = t("loginHint");
  set("quick-title", (el) => ((el as HTMLInputElement).placeholder = t("newDemand")));
  set("quick-due", (el) => (el.title = t("duedateTitle")));
  set("quick-btn", (el) => (el.title = t("createTitle")));
  set("btn-refresh", (el) => (el.title = t("refreshTitle")));
  set("btn-logout", (el) => (el.title = t("logoutTitle")));
  set("web-tip", (el) => (el.textContent = t("webTip")));
  const auto = document.querySelector(".autostart");
  if (auto) {
    // mantém o checkbox, troca só o texto
    const txt = auto.childNodes[auto.childNodes.length - 1];
    if (txt) txt.textContent = " " + t("autostart");
  }
}
