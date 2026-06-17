import { useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { t, lang } from '../i18n'
import { C } from '../theme'
import type { Demand } from '../api'
import { PlayIcon, PauseIcon, CheckIcon } from './icons'

function fmtDue(due: string | null): { label: string; bg: string; color: string } | null {
  if (!due) return null
  const today = new Date()
  const d = new Date(due + 'T00:00:00')
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const diff = Math.round((d.getTime() - t0) / 86_400_000)
  if (diff < 0) return { label: t('dueOverdue'), bg: C.redDim, color: C.redText }
  if (diff === 0) return { label: t('dueToday'), bg: C.blueDim, color: C.blueText }
  if (diff === 1) return { label: t('dueTomorrow'), bg: C.card, color: C.muted }
  return { label: d.toLocaleDateString(lang(), { day: '2-digit', month: '2-digit' }), bg: C.card, color: C.muted }
}

function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  )
}

// Estilhaços do PUFF (direção, cor e tamanho de cada caco). Espalham p/ todos os lados.
const SHARDS: { dx: number; dy: number; rot: number; color: string; size: number }[] = [
  { dx: -120, dy: -54, rot: -140, color: C.cyan, size: 11 },
  { dx: 118, dy: -64, rot: 160, color: C.white, size: 9 },
  { dx: -150, dy: 10, rot: -60, color: C.green, size: 10 },
  { dx: 156, dy: 4, rot: 90, color: C.cyan, size: 12 },
  { dx: -70, dy: 60, rot: -30, color: C.amber, size: 8 },
  { dx: 84, dy: 66, rot: 50, color: C.cyan, size: 10 },
  { dx: 8, dy: -84, rot: 20, color: C.white, size: 9 },
  { dx: -24, dy: 80, rot: -80, color: C.green, size: 8 },
  { dx: 44, dy: -40, rot: 120, color: C.cyan, size: 7 },
  { dx: -52, dy: -30, rot: -110, color: C.white, size: 8 },
]

/**
 * Linha de demanda do mobile. Ao concluir: TREME e EXPLODE (PUFF destrutivo —
 * estilhaços voam para todos os lados) antes de sair da lista. Play/pause e
 * concluir são otimistas (a tela responde na hora; o back vai junto).
 */
export function DemandRow({
  demand: d,
  onAdvance,
  onComplete,
}: {
  demand: Demand
  onAdvance: (status: 'nova' | 'trabalhando') => void
  onComplete: () => void
}) {
  const [leaving, setLeaving] = useState(false)
  const shake = useRef(new Animated.Value(0)).current
  const burst = useRef(new Animated.Value(0)).current

  function complete() {
    if (leaving) return
    setLeaving(true)
    Animated.sequence([
      // treme
      Animated.timing(shake, { toValue: 1, duration: 220, easing: Easing.linear, useNativeDriver: true }),
      // explode
      Animated.timing(burst, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onComplete())
  }

  const shakeX = shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -7, 7, -5, 5, 0] })
  const cardScale = burst.interpolate({ inputRange: [0, 0.25, 1], outputRange: [1, 1.12, 0.55] })
  const cardOpacity = burst.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1, 0] })

  const due = fmtDue(d.due_date)

  return (
    <Animated.View style={{ transform: [{ translateX: shakeX }, { scale: cardScale }], opacity: cardOpacity }}>
      <View style={[s.card, d.pinned && s.cardPinned]}>
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
          {d.status === 'trabalhando' && <Chip label={t('chipWorking')} bg={C.amberDim} color={C.amber} />}
          {d.priority === 'alta' && <Chip label={t('chipHigh')} bg={C.redDim} color={C.redText} />}
          {due && <Chip label={due.label} bg={due.bg} color={due.color} />}
          <View style={s.actions}>
            {d.status === 'nova' ? (
              <Pressable style={s.stBtn} onPress={() => onAdvance('trabalhando')} disabled={leaving}>
                <PlayIcon size={13} color={C.light} />
              </Pressable>
            ) : (
              <Pressable style={s.stBtn} onPress={() => onAdvance('nova')} disabled={leaving}>
                <PauseIcon size={13} color={C.light} />
              </Pressable>
            )}
            <Pressable style={[s.stBtn, s.stBtnDone]} onPress={complete} disabled={leaving}>
              <CheckIcon size={13} color={C.green} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Estilhaços do PUFF (sobre o card, durante a saída) */}
      {leaving && (
        <View style={s.shardLayer} pointerEvents="none">
          {SHARDS.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                s.shard,
                {
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                    { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
                    { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
                    { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1, 0.5] }) },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  cardPinned: { borderColor: C.orange, borderWidth: 1.5 },
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
  shardLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 8, alignItems: 'center', justifyContent: 'center' },
  shard: { position: 'absolute', borderRadius: 2 },
})
