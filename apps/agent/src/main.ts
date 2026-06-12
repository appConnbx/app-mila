import { getCurrentWindow, currentMonitor, LogicalSize, LogicalPosition } from '@tauri-apps/api/window'
import { enable as autostartEnable, disable as autostartDisable, isEnabled as autostartIsEnabled } from '@tauri-apps/plugin-autostart'
import { check as checkUpdate } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { supabase, fetchPending, fetchHoldings, createDemand, setDemandStatus, type Demand, type DemandStatus, type Holding } from './supabase'
import { COLLAPSED, EXPANDED, MIC, POLL_MS, APP_BASE_URL, MIC_HOLD_MS } from './config'
import { t, lang, initLang, applyHoldingsLang, applyStatic } from './i18n'

const win = getCurrentWindow()

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const pill = $<HTMLDivElement>('pill')
const pillCount = $<HTMLSpanElement>('pill-count')
const panel = $<HTMLDivElement>('panel')
const micPanel = $<HTMLDivElement>('micpanel')
const viewLogin = $<HTMLElement>('view-login')
const viewMain = $<HTMLElement>('view-main')
const listEl = $<HTMLDivElement>('list')
const btnLogout = $<HTMLButtonElement>('btn-logout')

// ---------------- Estado ----------------
type Mode = 'collapsed' | 'panel' | 'mic'
let mode: Mode = 'collapsed'
let pinned = false // tela de login ou gravação em curso: não recolhe
let mouseInside = false
let knownIds: Set<string> | null = null // null = ainda sem primeira carga
let demands: Demand[] = []
let holdings: Holding[] = []
let collapseTimer: number | undefined
let pollTimer: number | undefined
let pendingRelaunch = false

// "Vistas": demandas já exibidas com o painel aberto (persistido entre sessões).
const seen = new Set<string>(JSON.parse(localStorage.getItem('mila_seen') ?? '[]') as string[])
function persistSeen() {
  localStorage.setItem('mila_seen', JSON.stringify([...seen]))
}

// Instância padrão para criação (corporativa primeiro).
function defaultHolding(): Holding | undefined {
  return holdings.find((h) => h.kind === 'corporate') ?? holdings[0]
}

// ---------------- Janela: dock + modos ----------------
// panel: cresce centralizado na vertical. mic: cresce ancorado na base
// (o mini-painel "nasce" do botão de microfone da pílula).
function deltas(m: 'panel' | 'mic') {
  const s = m === 'panel' ? EXPANDED : MIC
  return {
    s,
    dx: s.w - COLLAPSED.w,
    dy: m === 'panel' ? Math.round((s.h - COLLAPSED.h) / 2) : s.h - COLLAPSED.h,
  }
}

async function dockToEdge() {
  const monitor = await currentMonitor()
  if (!monitor) return
  const scale = monitor.scaleFactor
  const size = monitor.size.toLogical(scale)
  const mpos = monitor.position.toLogical(scale)
  const x = mpos.x + size.width - COLLAPSED.w
  const y = mpos.y + Math.round((size.height - COLLAPSED.h) / 2)
  await win.setSize(new LogicalSize(COLLAPSED.w, COLLAPSED.h))
  await win.setPosition(new LogicalPosition(x, y))
}

async function expandTo(next: 'panel' | 'mic') {
  if (mode !== 'collapsed') return
  mode = next
  const { s, dx, dy } = deltas(next)
  const scale = await win.scaleFactor()
  const pos = (await win.outerPosition()).toLogical(scale)
  await win.setPosition(new LogicalPosition(pos.x - dx, pos.y - dy))
  await win.setSize(new LogicalSize(s.w, s.h))
  document.body.classList.add('expanded')
  panel.hidden = next !== 'panel'
  micPanel.hidden = next !== 'mic'
  pill.classList.remove('pulse')
  if (next === 'panel') void refresh()
  if (next === 'mic') {
    exitPreview() // limpa revisão antiga, se houver
    const h = defaultHolding()
    $<HTMLParagraphElement>('mic-target').textContent = h ? `→ ${h.name}` : ''
    micStatus(t('micHoldHint'), '')
  }
}

async function collapse() {
  if (mode === 'collapsed' || pinned) return
  // O usuário viu a lista: marca tudo como visto.
  if (mode === 'panel') {
    let changed = false
    for (const d of demands) {
      if (!seen.has(d.id)) {
        seen.add(d.id)
        changed = true
      }
    }
    if (changed) persistSeen()
  }
  // Atualização baixada enquanto o painel estava em uso: aplica agora.
  if (pendingRelaunch) {
    await relaunch()
    return
  }
  const { dx, dy } = deltas(mode)
  mode = 'collapsed'
  document.body.classList.remove('expanded')
  panel.hidden = true
  micPanel.hidden = true
  const scale = await win.scaleFactor()
  const pos = (await win.outerPosition()).toLogical(scale)
  await win.setSize(new LogicalSize(COLLAPSED.w, COLLAPSED.h))
  await win.setPosition(new LogicalPosition(pos.x + dx, pos.y + dy))
}

function scheduleCollapse() {
  window.clearTimeout(collapseTimer)
  collapseTimer = window.setTimeout(() => {
    // Só recolhe se o mouse realmente saiu (cliques/re-render não fecham).
    if (!mouseInside) void collapse()
  }, 450)
}

document.body.addEventListener('mouseenter', () => {
  mouseInside = true
  window.clearTimeout(collapseTimer)
})
document.body.addEventListener('mouseleave', () => {
  mouseInside = false
  scheduleCollapse()
})
$<HTMLDivElement>('pill-top').addEventListener('mouseenter', () => void expandTo('panel'))
$<HTMLDivElement>('pill-mic').addEventListener('mouseenter', () => {
  // Sem sessão, o painel abre no login.
  if (holdings.length === 0) void expandTo('panel')
  else void expandTo('mic')
})

// ---------------- Dados ----------------
function updateBadge() {
  pillCount.hidden = demands.length === 0
  pillCount.textContent = String(demands.length)
}

async function refresh() {
  try {
    const fresh = await fetchPending()
    const freshIds = new Set(fresh.map((d) => d.id))
    const firstLoad = knownIds === null
    const novas = firstLoad ? [] : fresh.filter((d) => !knownIds!.has(d.id))

    demands = fresh
    knownIds = freshIds

    // Limpa "vistas" de demandas que saíram da lista (finalizadas etc.).
    let pruned = false
    for (const id of [...seen]) {
      if (!freshIds.has(id)) {
        seen.delete(id)
        pruned = true
      }
    }
    if (pruned) persistSeen()

    renderList(fresh)
    updateBadge() // contador sempre em dia, mesmo recolhido
    if (novas.length > 0 && mode !== 'panel') pill.classList.add('pulse')
  } catch {
    // Sem rede / sessão caiu: mantém o que tem; próxima rodada tenta de novo.
  }
}

function startPolling() {
  window.clearInterval(pollTimer)
  pollTimer = window.setInterval(() => void refresh(), POLL_MS)
}

function stopPolling() {
  window.clearInterval(pollTimer)
}

function fmtDue(due: string | null): { label: string; cls: string } | null {
  if (!due) return null
  const today = new Date()
  const d = new Date(due + 'T00:00:00')
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const diff = Math.round((d.getTime() - t0) / 86_400_000)
  if (diff < 0) return { label: t('dueOverdue'), cls: 'overdue' }
  if (diff === 0) return { label: t('dueToday'), cls: 'today' }
  if (diff === 1) return { label: t('dueTomorrow'), cls: '' }
  return { label: d.toLocaleDateString(lang(), { day: '2-digit', month: '2-digit' }), cls: '' }
}

function renderList(items: Demand[]) {
  listEl.innerHTML = ''
  if (items.length === 0) {
    const p = document.createElement('p')
    p.className = 'empty'
    p.textContent = t('emptyList')
    listEl.appendChild(p)
    return
  }
  for (const d of items) {
    const isUnseen = !seen.has(d.id)
    const card = document.createElement('div')
    card.className = 'item' + (isUnseen ? ' unseen' : '')

    const title = document.createElement('div')
    title.className = 'item-title'
    title.textContent = d.title
    card.appendChild(title)

    if (d.description) {
      const desc = document.createElement('div')
      desc.className = 'item-desc'
      desc.textContent = d.description
      desc.title = d.description
      card.appendChild(desc)
    }

    const meta = document.createElement('div')
    meta.className = 'item-meta'
    if (isUnseen) {
      const nv = document.createElement('span')
      nv.className = 'chip nova'
      nv.textContent = t('chipNew')
      meta.appendChild(nv)
    }
    const inst = document.createElement('span')
    inst.className = 'chip' + (d.holding_kind === 'family' ? ' family' : '')
    inst.textContent = d.holding_name
    meta.appendChild(inst)
    if (d.status === 'trabalhando') {
      const st = document.createElement('span')
      st.className = 'chip working'
      st.textContent = t('chipWorking')
      meta.appendChild(st)
    }
    if (d.priority === 'alta') {
      const pr = document.createElement('span')
      pr.className = 'chip prio-alta'
      pr.textContent = t('chipHigh')
      meta.appendChild(pr)
    }
    const due = fmtDue(d.due_date)
    if (due) {
      const dd = document.createElement('span')
      dd.className = `chip due ${due.cls}`.trim()
      dd.textContent = due.label
      meta.appendChild(dd)
    }

    // Ações de status: nova ⇄ trabalhando, e concluir.
    const actions = document.createElement('span')
    actions.className = 'item-actions'
    const mk = (label: string, titleTxt: string, cls: string, next: DemandStatus) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = `st-btn ${cls}`
      b.textContent = label
      b.title = titleTxt
      b.addEventListener('click', async () => {
        b.disabled = true
        try {
          await setDemandStatus(d.id, next)
          await refresh()
        } catch {
          b.disabled = false
        }
      })
      return b
    }
    if (d.status === 'nova') {
      actions.appendChild(mk('▶', t('startWork'), 'start', 'trabalhando'))
    } else {
      actions.appendChild(mk('⏸', t('backToNew'), 'pause', 'nova'))
    }
    actions.appendChild(mk('✓', t('finish'), 'done', 'finalizada'))
    meta.appendChild(actions)

    card.appendChild(meta)
    listEl.appendChild(card)
  }
}

// ---------------- Login / sessão ----------------
function showLogin() {
  viewLogin.hidden = false
  viewMain.hidden = true
  btnLogout.hidden = true
  pinned = true
  void expandTo('panel')
}

async function showMain() {
  viewLogin.hidden = true
  viewMain.hidden = false
  btnLogout.hidden = false
  pinned = false
  try {
    holdings = await fetchHoldings()
  } catch {
    holdings = []
  }
  // Idioma da instância (corporativa prevalece) — retraduz a interface.
  if (applyHoldingsLang(holdings)) applyStatic()
  const sel = $<HTMLSelectElement>('quick-holding')
  sel.innerHTML = ''
  for (const h of holdings) {
    const o = document.createElement('option')
    o.value = h.id
    o.textContent = h.name
    sel.appendChild(o)
  }
  // Padrão: instância corporativa pré-selecionada (se existir).
  const corp = defaultHolding()
  if (corp) sel.value = corp.id
  // Primeiro login: liga "iniciar com o Windows" uma única vez (usuário pode desligar).
  try {
    if (!localStorage.getItem('mila_autostart_done')) {
      await autostartEnable()
      localStorage.setItem('mila_autostart_done', '1')
    }
    $<HTMLInputElement>('chk-autostart').checked = await autostartIsEnabled()
  } catch {
    /* dev sem bundle: ignora */
  }
  knownIds = null
  await refresh()
  startPolling()
}

$<HTMLFormElement>('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = $<HTMLButtonElement>('login-btn')
  const errEl = $<HTMLParagraphElement>('login-error')
  errEl.hidden = true
  btn.disabled = true
  btn.textContent = t('signingIn')
  const email = $<HTMLInputElement>('login-email').value.trim()
  const password = $<HTMLInputElement>('login-password').value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  btn.disabled = false
  btn.textContent = t('signIn')
  if (error) {
    errEl.textContent = t('badCredentials')
    errEl.hidden = false
    return
  }
  await showMain()
})

btnLogout.addEventListener('click', async () => {
  stopPolling()
  await supabase.auth.signOut()
  // Saiu da conta: zera tudo que era do usuário (lista, contador, formulário).
  demands = []
  holdings = []
  knownIds = null
  listEl.innerHTML = ''
  updateBadge()
  pill.classList.remove('pulse')
  ;($<HTMLFormElement>('quick-form')).reset()
  showLogin()
})

// ---------------- Transcrição (compartilhada) ----------------
async function transcribeBlob(blob: Blob): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('sem-sessao')
  const fd = new FormData()
  fd.append('file', blob, 'audio.webm')
  const res = await fetch(`${APP_BASE_URL}/api/agent/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  if (res.status === 503) throw new Error('nao-configurada')
  if (!res.ok) throw new Error(String(res.status))
  const out = (await res.json()) as { text?: string }
  const text = (out.text ?? '').trim()
  if (!text) throw new Error('vazio')
  return text
}

function splitTranscript(text: string): { title: string; description: string | null } {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length > 180) return { title: clean.slice(0, 177) + '…', description: clean }
  return { title: clean, description: null }
}

/** Demanda por voz nasce com prazo no dia seguinte. */
function tomorrowISO(): string {
  const d = new Date(Date.now() + 86_400_000)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}

// ---------------- Criação rápida (formulário) ----------------
$<HTMLFormElement>('quick-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const titleEl = $<HTMLInputElement>('quick-title')
  const dueEl = $<HTMLInputElement>('quick-due')
  const errEl = $<HTMLParagraphElement>('quick-error')
  const btn = $<HTMLButtonElement>('quick-btn')
  const title = titleEl.value.trim()
  const holdingId = $<HTMLSelectElement>('quick-holding').value
  if (!title || !holdingId) return
  errEl.hidden = true
  btn.disabled = true
  try {
    await createDemand(holdingId, title, dueEl.value || null)
    titleEl.value = ''
    dueEl.value = ''
    await refresh()
  } catch {
    errEl.textContent = t('createFailed')
    errEl.hidden = false
  } finally {
    btn.disabled = false
  }
})

// ---------------- Segure-e-fale (mini-painel da pílula) ----------------
// Segura = grava (até 10s, com efeito); solta = transcreve e CRIA direto
// na instância padrão (corporativa).
const holdBtn = $<HTMLButtonElement>('hold-btn')
const micBarFill = $<HTMLDivElement>('mic-bar-fill')
let holdRecorder: MediaRecorder | null = null
let holdChunks: Blob[] = []
let holdTimer: number | undefined
let holdStart = 0

function micStatus(msg: string, cls: '' | 'ok' | 'err') {
  const el = $<HTMLParagraphElement>('mic-status')
  el.textContent = msg
  el.className = `mic-status ${cls}`.trim()
}

// Revisão pós-gravação: o áudio é aceito por padrão (contagem regressiva);
// "Recusar" descarta antes de criar.
let previewTimer: number | undefined
let previewText: string | null = null
let previewCount = 0

function exitPreview() {
  window.clearInterval(previewTimer)
  previewText = null
  $<HTMLParagraphElement>('mic-preview').hidden = true
  $<HTMLDivElement>('mic-actions').hidden = true
  holdBtn.hidden = false
}

function showPreview(text: string) {
  previewText = text
  const pv = $<HTMLParagraphElement>('mic-preview')
  pv.textContent = text
  pv.title = text
  pv.hidden = false
  $<HTMLDivElement>('mic-actions').hidden = false
  holdBtn.hidden = true
  previewCount = 3
  micStatus(t('micCountdown').replace('{s}', String(previewCount)), '')
  previewTimer = window.setInterval(() => {
    previewCount -= 1
    if (previewCount <= 0) {
      void acceptPreview()
      return
    }
    micStatus(t('micCountdown').replace('{s}', String(previewCount)), '')
  }, 1000)
}

async function acceptPreview() {
  window.clearInterval(previewTimer)
  const text = previewText
  exitPreview()
  if (!text) return
  holdBtn.classList.add('busy')
  micStatus(t('micCreating'), '')
  try {
    const { title, description } = splitTranscript(text)
    const h = defaultHolding()
    if (!h) throw new Error('sem-instancia')
    await createDemand(h.id, title, tomorrowISO(), description)
    await refresh()
    micStatus(`${t('micCreated')}: ${title.slice(0, 40)}${title.length > 40 ? '…' : ''}`, 'ok')
    window.setTimeout(() => {
      pinned = false
      if (!mouseInside) void collapse()
    }, 1400)
  } catch {
    micStatus(t('micFailed'), 'err')
    pinned = false
  } finally {
    holdBtn.classList.remove('busy')
  }
}

$<HTMLButtonElement>('mic-reject').addEventListener('click', () => {
  exitPreview()
  micStatus(t('micRefused'), '')
  pinned = false
})

async function holdStop() {
  if (holdRecorder?.state === 'recording') holdRecorder.stop()
}

holdBtn.addEventListener('pointerdown', async (e) => {
  e.preventDefault()
  if (holdRecorder?.state === 'recording' || holdBtn.classList.contains('busy')) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    holdChunks = []
    holdStart = Date.now()
    holdRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    holdRecorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) holdChunks.push(ev.data)
    }
    holdRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      window.clearTimeout(holdTimer)
      holdBtn.classList.remove('recording')
      micBarFill.classList.remove('running')
      micBarFill.style.width = '0%'
      const duration = Date.now() - holdStart
      if (duration < 500) {
        pinned = false
        micStatus(t('micTooShort'), 'err')
        return
      }
      holdBtn.classList.add('busy')
      micStatus(t('micTranscribing'), '')
      try {
        const text = await transcribeBlob(new Blob(holdChunks, { type: 'audio/webm' }))
        holdBtn.classList.remove('busy')
        // Aceito por padrão: contagem regressiva cria sozinho; Recusar aborta.
        showPreview(text)
      } catch (err) {
        holdBtn.classList.remove('busy')
        const m = (err as Error).message
        micStatus(m === 'nao-configurada' ? t('micNotConfigured') : t('micFailed'), 'err')
        pinned = false
      }
    }
    holdRecorder.start()
    pinned = true // gravação em curso: não recolhe nem com mouse fora
    holdBtn.classList.add('recording')
    micStatus(t('micRecording'), '')
    // Barra de progresso de 10s (CSS transition linear).
    micBarFill.classList.remove('running')
    micBarFill.style.width = '0%'
    requestAnimationFrame(() => micBarFill.classList.add('running'))
    holdTimer = window.setTimeout(() => void holdStop(), MIC_HOLD_MS)
  } catch {
    micStatus(t('micUnavailable'), 'err')
  }
})
holdBtn.addEventListener('pointerup', () => void holdStop())
holdBtn.addEventListener('pointercancel', () => void holdStop())
holdBtn.addEventListener('pointerleave', () => void holdStop())

$<HTMLButtonElement>('btn-refresh').addEventListener('click', () => void refresh())

$<HTMLInputElement>('chk-autostart').addEventListener('change', async (e) => {
  const on = (e.target as HTMLInputElement).checked
  try {
    if (on) await autostartEnable()
    else await autostartDisable()
  } catch {
    /* ignora em dev */
  }
})

// ---------------- Auto-update ----------------
// Verifica no boot e a cada 6h; baixa e instala sozinho. Só reinicia quando
// o painel não está em uso (senão marca e aplica ao recolher).
async function autoUpdate() {
  try {
    const update = await checkUpdate()
    if (!update) return
    await update.downloadAndInstall()
    if (mode === 'collapsed' && !pinned) {
      await relaunch()
    } else {
      pendingRelaunch = true
    }
  } catch {
    // offline / dev sem updater: tenta na próxima rodada
  }
}

// ---------------- Boot ----------------
async function boot() {
  initLang()
  applyStatic()
  await dockToEdge()
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    await showMain()
  } else {
    showLogin()
  }
  void autoUpdate()
  window.setInterval(() => void autoUpdate(), 6 * 60 * 60 * 1000)
}
void boot()
