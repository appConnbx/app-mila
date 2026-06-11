import { getCurrentWindow, currentMonitor, LogicalSize, LogicalPosition } from '@tauri-apps/api/window'
import { enable as autostartEnable, disable as autostartDisable, isEnabled as autostartIsEnabled } from '@tauri-apps/plugin-autostart'
import { check as checkUpdate } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { supabase, fetchPending, fetchHoldings, createDemand, setDemandStatus, type Demand, type DemandStatus, type Holding } from './supabase'
import { COLLAPSED, EXPANDED, POLL_MS } from './config'

const win = getCurrentWindow()

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const pill = $<HTMLDivElement>('pill')
const pillCount = $<HTMLSpanElement>('pill-count')
const panel = $<HTMLDivElement>('panel')
const viewLogin = $<HTMLElement>('view-login')
const viewMain = $<HTMLElement>('view-main')
const listEl = $<HTMLDivElement>('list')
const btnLogout = $<HTMLButtonElement>('btn-logout')

// ---------------- Estado ----------------
let expanded = false
let pinned = false // tela de login: não recolhe
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

// ---------------- Janela: dock + expand/collapse ----------------
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

async function expand() {
  if (expanded) return
  expanded = true
  const scale = await win.scaleFactor()
  const pos = (await win.outerPosition()).toLogical(scale)
  await win.setPosition(
    new LogicalPosition(pos.x - (EXPANDED.w - COLLAPSED.w), pos.y - Math.round((EXPANDED.h - COLLAPSED.h) / 2)),
  )
  await win.setSize(new LogicalSize(EXPANDED.w, EXPANDED.h))
  document.body.classList.add('expanded')
  panel.hidden = false
  pill.classList.remove('pulse')
  void refresh()
}

async function collapse() {
  if (!expanded || pinned) return
  // O usuário viu a lista: marca tudo como visto.
  let changed = false
  for (const d of demands) {
    if (!seen.has(d.id)) {
      seen.add(d.id)
      changed = true
    }
  }
  if (changed) persistSeen()
  // Atualização baixada enquanto o painel estava em uso: aplica agora.
  if (pendingRelaunch) {
    await relaunch()
    return
  }
  expanded = false
  document.body.classList.remove('expanded')
  panel.hidden = true
  const scale = await win.scaleFactor()
  const pos = (await win.outerPosition()).toLogical(scale)
  await win.setSize(new LogicalSize(COLLAPSED.w, COLLAPSED.h))
  await win.setPosition(
    new LogicalPosition(pos.x + (EXPANDED.w - COLLAPSED.w), pos.y + Math.round((EXPANDED.h - COLLAPSED.h) / 2)),
  )
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
  void expand()
})
document.body.addEventListener('mouseleave', () => {
  mouseInside = false
  scheduleCollapse()
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
    if (novas.length > 0 && !expanded) pill.classList.add('pulse')
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
  if (diff < 0) return { label: 'atrasada', cls: 'overdue' }
  if (diff === 0) return { label: 'hoje', cls: 'today' }
  if (diff === 1) return { label: 'amanhã', cls: '' }
  return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), cls: '' }
}

function renderList(items: Demand[]) {
  listEl.innerHTML = ''
  if (items.length === 0) {
    const p = document.createElement('p')
    p.className = 'empty'
    p.textContent = 'Nenhuma demanda pendente. 🎉'
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
      nv.textContent = 'nova'
      meta.appendChild(nv)
    }
    const inst = document.createElement('span')
    inst.className = 'chip' + (d.holding_kind === 'family' ? ' family' : '')
    inst.textContent = d.holding_name
    meta.appendChild(inst)
    if (d.status === 'trabalhando') {
      const st = document.createElement('span')
      st.className = 'chip working'
      st.textContent = 'em andamento'
      meta.appendChild(st)
    }
    if (d.priority === 'alta') {
      const pr = document.createElement('span')
      pr.className = 'chip prio-alta'
      pr.textContent = 'alta'
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
      actions.appendChild(mk('▶', 'Começar a trabalhar', 'start', 'trabalhando'))
    } else {
      actions.appendChild(mk('⏸', 'Voltar para nova', 'pause', 'nova'))
    }
    actions.appendChild(mk('✓', 'Concluir demanda', 'done', 'finalizada'))
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
  void expand()
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
  const sel = $<HTMLSelectElement>('quick-holding')
  sel.innerHTML = ''
  for (const h of holdings) {
    const o = document.createElement('option')
    o.value = h.id
    o.textContent = h.name
    sel.appendChild(o)
  }
  // Padrão: instância corporativa pré-selecionada (se existir).
  const corp = holdings.find((h) => h.kind === 'corporate')
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
  btn.textContent = 'Entrando…'
  const email = $<HTMLInputElement>('login-email').value.trim()
  const password = $<HTMLInputElement>('login-password').value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  btn.disabled = false
  btn.textContent = 'Entrar'
  if (error) {
    errEl.textContent = 'E-mail ou senha inválidos.'
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
  knownIds = null
  listEl.innerHTML = ''
  updateBadge()
  pill.classList.remove('pulse')
  ;($<HTMLFormElement>('quick-form')).reset()
  showLogin()
})

// ---------------- Criação rápida ----------------
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
    errEl.textContent = 'Não foi possível criar. Tente novamente.'
    errEl.hidden = false
  } finally {
    btn.disabled = false
  }
})

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
    if (!expanded && !pinned) {
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
