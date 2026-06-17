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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  supabase,
  fetchPending,
  fetchHoldings,
  createDemand,
  setDemandStatus,
  type Demand,
  type Holding,
} from '../api'
import { t, applyHoldingsLang, useLang } from '../i18n'
import { C } from '../theme'
import { POLL_MS } from '../config'
import { RecordModal } from './Record'
import { MicIcon } from '../components/icons'
import { DemandRow } from '../components/DemandRow'
import { VersionTag } from '../components/VersionTag'

export function Home({ openRecordSignal }: { openRecordSignal: number }) {
  const [demands, setDemands] = useState<Demand[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [selHolding, setSelHolding] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const uiLang = useLang() // re-renderiza quando o idioma da instância chega
  const insets = useSafeAreaInsets()
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

  // Otimista: a tela muda na hora; o back vai junto e só reconcilia em erro.
  function advance(d: Demand, status: 'nova' | 'trabalhando') {
    setDemands((prev) => prev.map((x) => (x.id === d.id ? { ...x, status } : x)))
    setDemandStatus(d.id, status).catch(() => void refresh())
  }

  // Chamado pelo DemandRow APÓS o PUFF: remove da lista e finaliza no back.
  function complete(d: Demand) {
    setDemands((prev) => prev.filter((x) => x.id !== d.id))
    setDemandStatus(d.id, 'finalizada').catch(() => void refresh())
  }

  function renderItem({ item: d }: { item: Demand }) {
    return <DemandRow demand={d} onAdvance={(status) => advance(d, status)} onComplete={() => complete(d)} />
  }

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.brandRow}>
          <View style={s.mark}>
            <Text style={s.markM}>M</Text>
          </View>
          <Text style={s.brand}>appMila</Text>
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
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
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

      {/* Botão de voz (FAB) — acima da navegação do sistema (safe area) */}
      <Pressable style={[s.fab, { bottom: insets.bottom + 24 }]} onPress={() => setRecordOpen(true)}>
        <MicIcon size={28} color={C.bg} />
      </Pressable>

      <RecordModal
        visible={recordOpen}
        holding={defaultHolding}
        onClose={() => setRecordOpen(false)}
        onCreated={() => void refresh()}
      />

      <VersionTag style={{ position: 'absolute', left: 16, bottom: insets.bottom + 12 }} />
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
