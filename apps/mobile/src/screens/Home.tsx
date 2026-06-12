import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl,
  AppState,
} from 'react-native'
import {
  supabase,
  fetchPending,
  fetchHoldings,
  createDemand,
  setDemandStatus,
  type Demand,
  type DemandStatus,
  type Holding,
} from '../api'
import { t, lang, applyHoldingsLang, useLang } from '../i18n'
import { C } from '../theme'
import { POLL_MS } from '../config'
import { RecordModal } from './Record'
import { MicIcon, PlayIcon, PauseIcon, CheckIcon } from '../components/icons'

function fmtDue(due: string | null): { label: string; bg: string; color: string } | null {
  if (!due) return null
  const today = new Date()
  const d = new Date(due + 'T00:00:00')
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const diff = Math.round((d.getTime() - t0) / 86_400_000)
  if (diff < 0) return { label: t('dueOverdue'), bg: C.redDim, color: C.redText }
  if (diff === 0) return { label: t('dueToday'), bg: C.blueDim, color: C.blueText }
  if (diff === 1) return { label: t('dueTomorrow'), bg: C.card, color: C.muted }
  return {
    label: d.toLocaleDateString(lang(), { day: '2-digit', month: '2-digit' }),
    bg: C.card,
    color: C.muted,
  }
}

function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  )
}

export function Home({ openRecordSignal }: { openRecordSignal: number }) {
  const [demands, setDemands] = useState<Demand[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [selHolding, setSelHolding] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const uiLang = useLang() // re-renderiza quando o idioma da instância chega
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdingsRef = useRef<Holding[]>([])

  const loadHoldings = useCallback(async () => {
    try {
      const hs = await fetchHoldings()
      holdingsRef.current = hs
      setHoldings(hs)
      applyHoldingsLang(hs)
      const corp = hs.find((h) => h.kind === 'corporate') ?? hs[0]
      if (corp) setSelHolding((cur) => cur ?? corp.id)
    } catch {
      /* tenta no próximo ciclo */
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      setDemands(await fetchPending())
    } catch {
      /* offline: mantém o que tem */
    }
    // Instâncias ainda não carregadas (ex.: rede falhou no boot): tenta de novo.
    if (holdingsRef.current.length === 0) void loadHoldings()
  }, [loadHoldings])

  // Carga inicial: instâncias (idioma) + lista + polling + retomada do app.
  useEffect(() => {
    void loadHoldings()
    void refresh()
    pollRef.current = setInterval(() => void refresh(), POLL_MS)
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void refresh()
    })
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      sub.remove()
    }
  }, [refresh, loadHoldings])

  // Deep link do widget (mila://record): abre o gravador direto.
  useEffect(() => {
    if (openRecordSignal > 0) setRecordOpen(true)
  }, [openRecordSignal])

  const defaultHolding = holdings.find((h) => h.id === selHolding) ?? holdings[0]

  async function create() {
    const txt = title.trim()
    if (!txt || !selHolding || creating) return
    setCreating(true)
    try {
      await createDemand(selHolding, txt)
      setTitle('')
      await refresh()
    } catch {
      /* mantém o texto para tentar de novo */
    } finally {
      setCreating(false)
    }
  }

  async function setStatus(d: Demand, status: DemandStatus) {
    try {
      await setDemandStatus(d.id, status)
      await refresh()
    } catch {
      /* silencioso */
    }
  }

  function renderItem({ item: d }: { item: Demand }) {
    const due = fmtDue(d.due_date)
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>{d.title}</Text>
        {d.description ? (
          <Text style={s.cardDesc} numberOfLines={2}>
            {d.description}
          </Text>
        ) : null}
        <View style={s.metaRow}>
          <Chip
            label={d.holding_name}
            bg={d.holding_kind === 'family' ? C.orangeDim : C.cyanDim}
            color={d.holding_kind === 'family' ? C.orange : C.cyan}
          />
          {d.status === 'trabalhando' && (
            <Chip label={t('chipWorking')} bg={C.amberDim} color={C.amber} />
          )}
          {d.priority === 'alta' && <Chip label={t('chipHigh')} bg={C.redDim} color={C.redText} />}
          {due && <Chip label={due.label} bg={due.bg} color={due.color} />}
          <View style={s.actions}>
            {d.status === 'nova' ? (
              <Pressable style={s.stBtn} onPress={() => void setStatus(d, 'trabalhando')}>
                <PlayIcon size={13} color={C.light} />
              </Pressable>
            ) : (
              <Pressable style={s.stBtn} onPress={() => void setStatus(d, 'nova')}>
                <PauseIcon size={13} color={C.light} />
              </Pressable>
            )}
            <Pressable style={[s.stBtn, s.stBtnDone]} onPress={() => void setStatus(d, 'finalizada')}>
              <CheckIcon size={13} color={C.green} />
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={s.wrap}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.brandRow}>
          <View style={s.mark}>
            <Text style={s.markM}>M</Text>
          </View>
          <Text style={s.brand}>MILA</Text>
        </View>
        <Pressable onPress={() => void supabase.auth.signOut()}>
          <Text style={s.logout}>{t('signOut')}</Text>
        </Pressable>
      </View>

      {/* Criação rápida */}
      <View style={s.quick}>
        <TextInput
          style={s.quickInput}
          placeholder={t('newDemand')}
          placeholderTextColor={C.faint}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={() => void create()}
          maxLength={200}
        />
        <View style={s.quickRow}>
          <View style={s.holdingChips}>
            {holdings.map((h) => (
              <Pressable
                key={h.id}
                style={[s.hChip, selHolding === h.id && s.hChipSel]}
                onPress={() => setSelHolding(h.id)}
              >
                <Text style={[s.hChipText, selHolding === h.id && s.hChipTextSel]} numberOfLines={1}>
                  {h.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[s.createBtn, creating && { opacity: 0.6 }]}
            onPress={() => void create()}
            disabled={creating}
          >
            <Text style={s.createBtnText}>{t('create')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Lista */}
      <Text style={s.sectionTitle}>
        {t('pendingTitle')} {demands.length > 0 ? `(${demands.length})` : ''}
      </Text>
      <FlatList
        data={demands}
        extraData={uiLang}
        keyExtractor={(d) => d.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={<Text style={s.empty}>{t('emptyList')}</Text>}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.cyan}
            onRefresh={async () => {
              setRefreshing(true)
              await refresh()
              setRefreshing(false)
            }}
          />
        }
      />

      {/* Botão de voz (FAB) */}
      <Pressable style={s.fab} onPress={() => setRecordOpen(true)}>
        <MicIcon size={28} color={C.bg} />
      </Pressable>

      <RecordModal
        visible={recordOpen}
        holding={defaultHolding}
        onClose={() => setRecordOpen(false)}
        onCreated={() => void refresh()}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, paddingTop: 56, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markM: { color: C.bg, fontWeight: '900', fontSize: 15 },
  brand: { color: C.white, fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  logout: { color: C.faint, fontSize: 13 },
  quick: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
    marginBottom: 16,
  },
  quickInput: { color: C.white, fontSize: 15, paddingHorizontal: 6, paddingVertical: 8 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  holdingChips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 11,
    paddingVertical: 5,
    maxWidth: 160,
  },
  hChipSel: { backgroundColor: C.cyanDim, borderColor: C.cyan },
  hChipText: { color: C.muted, fontSize: 12 },
  hChipTextSel: { color: C.cyan, fontWeight: '700' },
  createBtn: {
    backgroundColor: C.cyan,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  createBtnText: { color: C.bg, fontWeight: '700', fontSize: 13 },
  sectionTitle: { color: C.white, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { color: C.white, fontWeight: '600', fontSize: 14.5, lineHeight: 20 },
  cardDesc: { color: C.muted, fontStyle: 'italic', fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  stBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stBtnDone: { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: C.greenDim },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: C.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
})
