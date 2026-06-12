import { useEffect, useRef, useState } from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio'
import { transcribeAudio, splitTranscript, createDemand, tomorrowISO, type Holding } from '../api'
import { t, useLang } from '../i18n'
import { C } from '../theme'
import { MIC_HOLD_MS } from '../config'
import { MicIcon, XIcon } from '../components/icons'

type Phase = 'idle' | 'recording' | 'transcribing' | 'preview' | 'creating' | 'done' | 'error'

/** Gravador segure-e-fale: solta = transcreve; aceita por padrão (contagem);
 *  "Recusar" descarta antes de criar. Mesmo fluxo do agente desktop. */
export function RecordModal({
  visible,
  holding,
  onClose,
  onCreated,
}: {
  visible: boolean
  holding: Holding | undefined
  onClose: () => void
  onCreated: () => void
}) {
  useLang() // re-renderiza quando o idioma da instância chega
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const [phase, setPhase] = useState<Phase>('idle')
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState('')
  const [progress, setProgress] = useState(0) // 0..1 da gravação
  const startedAt = useRef(0)
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopping = useRef(false)

  function clearTimers() {
    if (capTimer.current) clearTimeout(capTimer.current)
    if (tickTimer.current) clearInterval(tickTimer.current)
    if (countTimer.current) clearInterval(countTimer.current)
    capTimer.current = null
    tickTimer.current = null
    countTimer.current = null
  }

  useEffect(() => {
    if (visible) {
      setPhase('idle')
      setStatus(t('voiceHoldHint'))
      setPreview('')
      setProgress(0)
    }
    return clearTimers
  }, [visible])

  async function startHold() {
    if (phase !== 'idle' && phase !== 'error') return
    try {
      const perm = await requestRecordingPermissionsAsync()
      if (!perm.granted) {
        setPhase('error')
        setStatus(t('voiceUnavailable'))
        return
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
      stopping.current = false
      startedAt.current = Date.now()
      setPhase('recording')
      setStatus(t('voiceRecording'))
      setProgress(0)
      tickTimer.current = setInterval(() => {
        setProgress(Math.min(1, (Date.now() - startedAt.current) / MIC_HOLD_MS))
      }, 100)
      capTimer.current = setTimeout(() => void stopHold(), MIC_HOLD_MS)
    } catch {
      setPhase('error')
      setStatus(t('voiceUnavailable'))
    }
  }

  async function stopHold() {
    if (stopping.current || phase === 'idle') return
    stopping.current = true
    clearTimers()
    setProgress(0)
    const duration = Date.now() - startedAt.current
    try {
      await recorder.stop()
    } catch {
      /* já parado */
    }
    if (duration < 500) {
      setPhase('error')
      setStatus(t('voiceTooShort'))
      return
    }
    const uri = recorder.uri
    if (!uri) {
      setPhase('error')
      setStatus(t('voiceFailed'))
      return
    }
    setPhase('transcribing')
    setStatus(t('voiceTranscribing'))
    try {
      const text = await transcribeAudio(uri)
      showPreview(text)
    } catch (err) {
      setPhase('error')
      const m = (err as Error).message
      if (m === 'nao-configurada') {
        setStatus(t('voiceNotConfigured'))
      } else {
        // Inclui o código para diagnóstico (ex.: 502 = provedor, 422 = silêncio).
        setStatus(`${t('voiceFailed')} [${m}]`)
      }
    }
  }

  function showPreview(text: string) {
    setPreview(text)
    setPhase('preview')
    let count = 5
    setStatus(t('voiceCountdown').replace('{s}', String(count)))
    countTimer.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearTimers()
        void accept(text)
        return
      }
      setStatus(t('voiceCountdown').replace('{s}', String(count)))
    }, 1000)
  }

  async function accept(text: string) {
    setPhase('creating')
    setStatus(t('voiceCreating'))
    try {
      if (!holding) throw new Error('sem-instancia')
      const { title, description } = splitTranscript(text)
      await createDemand(holding.id, title, description, tomorrowISO())
      onCreated()
      setPhase('done')
      setStatus(`${t('voiceCreated')}: ${title.slice(0, 40)}${title.length > 40 ? '…' : ''}`)
      setTimeout(onClose, 1300)
    } catch {
      setPhase('error')
      setStatus(t('voiceFailed'))
    }
  }

  function refuse() {
    clearTimers()
    setPreview('')
    setPhase('idle')
    setStatus(t('voiceRefused'))
  }

  const recording = phase === 'recording'
  const busy = phase === 'transcribing' || phase === 'creating'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <Text style={s.title}>{t('voiceTitle')}</Text>

          {phase === 'preview' ? (
            <>
              <Text style={s.preview} numberOfLines={4}>
                {preview}
              </Text>
              <Pressable style={s.refuseBtn} onPress={refuse}>
                <XIcon size={13} color={C.redText} />
                <Text style={s.refuseText}>{t('voiceRefuse').replace('✕ ', '')}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[s.holdBtn, recording && s.holdBtnRec, busy && s.holdBtnBusy]}
              onPressIn={startHold}
              onPressOut={() => void stopHold()}
              disabled={busy || phase === 'done'}
            >
              <MicIcon size={recording ? 42 : 38} color={recording ? C.redText : C.cyan} />
            </Pressable>
          )}

          <View style={s.bar}>
            <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <Text
            style={[
              s.status,
              phase === 'done' && s.statusOk,
              phase === 'error' && s.statusErr,
            ]}
          >
            {status}
          </Text>
          {holding && <Text style={s.target}>→ {holding.name}</Text>}

          <Pressable style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeText}>{t('close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,17,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  title: { color: C.white, fontWeight: '700', fontSize: 16 },
  holdBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(34,211,238,0.6)',
    backgroundColor: C.cyanDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdBtnRec: {
    borderColor: C.red,
    backgroundColor: 'rgba(244,63,94,0.25)',
    transform: [{ scale: 1.1 }],
  },
  holdBtnBusy: { opacity: 0.55 },
  preview: {
    color: C.light,
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  refuseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.5)',
    backgroundColor: C.redDim,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  refuseText: { color: C.redText, fontWeight: '700', fontSize: 14 },
  bar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: C.cyan, borderRadius: 2 },
  status: { color: C.muted, fontSize: 13, textAlign: 'center' },
  statusOk: { color: C.green },
  statusErr: { color: C.redText },
  target: { color: C.cyan, fontSize: 12 },
  closeBtn: { marginTop: 4, padding: 6 },
  closeText: { color: C.faint, fontSize: 13 },
})
