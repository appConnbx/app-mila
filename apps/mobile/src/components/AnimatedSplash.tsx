import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { C } from '../theme'

/**
 * Abertura do app: o logo (M) CRESCE e assenta; então uma VARREDURA DE LUZ
 * (light sweep) — dois fachos — passa sobre o badge, repetindo enquanto a
 * sessão/idioma carregam. Sucede o splash nativo (mesmo badge sobre escuro).
 * O App garante um tempo mínimo de exibição para o efeito sempre acontecer.
 */
export function AnimatedSplash() {
  const grow = useRef(new Animated.Value(0)).current // crescimento inicial
  const sweep = useRef(new Animated.Value(0)).current // varredura de luz (loop)
  const idle = useRef(new Animated.Value(0)).current // pulso suave
  const word = useRef(new Animated.Value(0)).current // wordmark entra

  useEffect(() => {
    Animated.sequence([
      Animated.timing(grow, { toValue: 1, duration: 460, easing: Easing.out(Easing.back(1.7)), useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.parallel([
          // pulso do badge
          Animated.sequence([
            Animated.timing(idle, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(idle, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
          // varredura de luz: passa, some, espera e repete
          Animated.sequence([
            Animated.timing(sweep, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
            Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.delay(560),
          ]),
        ]),
      ).start()
    })
  }, [grow, sweep, idle, word])

  const growScale = grow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
  const growOpacity = grow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] })
  const idleScale = idle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] })
  const glowOpacity = idle.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.4] })
  // Fachos: o grupo varre da esquerda p/ a direita do badge.
  const sweepX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-86, 92] })
  const sweepOpacity = sweep.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] })
  const wordY = word.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.badgeBox, { opacity: growOpacity, transform: [{ scale: Animated.multiply(growScale, idleScale) }] }]}>
        <Animated.View style={[s.glow, { opacity: glowOpacity }]} />
        <View style={s.mark}>
          <Text style={s.markM}>M</Text>
          {/* Varredura de luz (clipada ao badge por overflow:hidden) */}
          <Animated.View style={[s.sweepGroup, { opacity: sweepOpacity, transform: [{ translateX: sweepX }, { rotate: '22deg' }] }]}>
            <View style={[s.beam, { width: 20 }]} />
            <View style={[s.beam, { width: 11, marginLeft: 16, opacity: 0.6 }]} />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.Text style={[s.brand, { opacity: word, transform: [{ translateY: wordY }] }]}>appMila</Animated.Text>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 22 },
  badgeBox: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 116, height: 116, borderRadius: 34, backgroundColor: C.cyan },
  mark: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markM: { color: C.bg, fontWeight: '900', fontSize: 50 },
  sweepGroup: { position: 'absolute', left: 0, top: -50, bottom: -50, flexDirection: 'row', alignItems: 'center' },
  beam: { height: 220, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 8 },
  brand: { color: C.white, fontWeight: '800', fontSize: 26, letterSpacing: 2 },
})
