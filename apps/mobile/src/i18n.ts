// i18n do app mobile (mesma regra do agente desktop): o idioma vem da
// configuração da instância (holdings.language); em divergência, a
// CORPORATIVA prevalece. Antes do login: último conhecido ou o do sistema.
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Lang = 'pt-BR' | 'en' | 'es'

const DICT = {
  'pt-BR': {
    appTagline: 'Suas demandas, sempre à vista.',
    loginHint: 'Entre com a mesma conta do MILA web.',
    email: 'E-mail',
    password: 'Senha',
    signIn: 'Entrar',
    signingIn: 'Entrando…',
    badCredentials: 'E-mail ou senha inválidos.',
    pendingTitle: 'Pendentes',
    newDemand: 'Nova demanda…',
    create: 'Criar',
    createFailed: 'Não foi possível criar. Tente novamente.',
    emptyList: 'Nenhuma demanda pendente. 🎉',
    chipNew: 'nova',
    chipWorking: 'em andamento',
    chipHigh: 'alta',
    dueOverdue: 'atrasada',
    dueToday: 'hoje',
    dueTomorrow: 'amanhã',
    startWork: 'Começar',
    backToNew: 'Voltar',
    finish: 'Concluir',
    signOut: 'Sair da conta',
    voiceTitle: 'Demanda por voz',
    voiceHoldHint: 'Segure o botão e fale (até 10s)',
    voiceRecording: 'Gravando… solte para criar.',
    voiceTranscribing: 'Transcrevendo…',
    voiceCreating: 'Criando demanda…',
    voiceCreated: '✓ Criada',
    voiceTooShort: 'Muito curto — segure enquanto fala.',
    voiceNotConfigured: 'Transcrição ainda não configurada.',
    voiceFailed: 'Não deu certo — tente de novo.',
    voiceUnavailable: 'Microfone indisponível ou sem permissão.',
    voiceCountdown: 'Criando em {s}s — recuse se não ficou bom.',
    voiceRefuse: '✕ Recusar',
    voiceRefused: 'Descartada — grave outra se quiser.',
    close: 'Fechar',
  },
  en: {
    appTagline: 'Your tasks, always in sight.',
    loginHint: 'Sign in with the same MILA web account.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    badCredentials: 'Invalid email or password.',
    pendingTitle: 'Pending',
    newDemand: 'New task…',
    create: 'Create',
    createFailed: "Couldn't create. Try again.",
    emptyList: 'No pending tasks. 🎉',
    chipNew: 'new',
    chipWorking: 'in progress',
    chipHigh: 'high',
    dueOverdue: 'overdue',
    dueToday: 'today',
    dueTomorrow: 'tomorrow',
    startWork: 'Start',
    backToNew: 'Back',
    finish: 'Finish',
    signOut: 'Sign out',
    voiceTitle: 'Voice task',
    voiceHoldHint: 'Hold the button and speak (up to 10s)',
    voiceRecording: 'Recording… release to create.',
    voiceTranscribing: 'Transcribing…',
    voiceCreating: 'Creating task…',
    voiceCreated: '✓ Created',
    voiceTooShort: 'Too short — hold while you speak.',
    voiceNotConfigured: 'Voice transcription not configured yet.',
    voiceFailed: "Didn't work — try again.",
    voiceUnavailable: 'Microphone unavailable or no permission.',
    voiceCountdown: "Creating in {s}s — discard if it's wrong.",
    voiceRefuse: '✕ Discard',
    voiceRefused: 'Discarded — record another if you like.',
    close: 'Close',
  },
  es: {
    appTagline: 'Tus tareas, siempre a la vista.',
    loginHint: 'Entra con la misma cuenta de MILA web.',
    email: 'Correo',
    password: 'Contraseña',
    signIn: 'Entrar',
    signingIn: 'Entrando…',
    badCredentials: 'Correo o contraseña inválidos.',
    pendingTitle: 'Pendientes',
    newDemand: 'Nueva tarea…',
    create: 'Crear',
    createFailed: 'No se pudo crear. Inténtalo de nuevo.',
    emptyList: 'Sin tareas pendientes. 🎉',
    chipNew: 'nueva',
    chipWorking: 'en curso',
    chipHigh: 'alta',
    dueOverdue: 'atrasada',
    dueToday: 'hoy',
    dueTomorrow: 'mañana',
    startWork: 'Empezar',
    backToNew: 'Volver',
    finish: 'Concluir',
    signOut: 'Cerrar sesión',
    voiceTitle: 'Tarea por voz',
    voiceHoldHint: 'Mantén el botón y habla (hasta 10s)',
    voiceRecording: 'Grabando… suelta para crear.',
    voiceTranscribing: 'Transcribiendo…',
    voiceCreating: 'Creando tarea…',
    voiceCreated: '✓ Creada',
    voiceTooShort: 'Muy corto — mantén mientras hablas.',
    voiceNotConfigured: 'Transcripción aún no configurada.',
    voiceFailed: 'No funcionó — inténtalo de nuevo.',
    voiceUnavailable: 'Micrófono no disponible o sin permiso.',
    voiceCountdown: 'Creando en {s}s — rechaza si no quedó bien.',
    voiceRefuse: '✕ Rechazar',
    voiceRefused: 'Descartada — graba otra si quieres.',
    close: 'Cerrar',
  },
} as const

export type I18nKey = keyof (typeof DICT)['pt-BR']

let current: Lang = 'pt-BR'

export function lang(): Lang {
  return current
}

export function t(key: I18nKey): string {
  return DICT[current][key]
}

function isLang(v: unknown): v is Lang {
  return v === 'pt-BR' || v === 'en' || v === 'es'
}

export async function initLang(systemLocale: string | null) {
  const saved = await AsyncStorage.getItem('mila_lang')
  if (isLang(saved)) {
    current = saved
    return
  }
  const sys = systemLocale ?? 'pt'
  if (sys.startsWith('pt')) current = 'pt-BR'
  else if (sys.startsWith('es')) current = 'es'
  else current = 'en'
}

/** Idioma das instâncias: corporativa prevalece. Retorna se mudou. */
export function applyHoldingsLang(
  holdings: { kind: string; language?: string | null }[],
): boolean {
  const corp = holdings.find((h) => h.kind === 'corporate')
  const pick = corp?.language ?? holdings[0]?.language
  if (!isLang(pick) || pick === current) return false
  current = pick
  void AsyncStorage.setItem('mila_lang', pick)
  return true
}
