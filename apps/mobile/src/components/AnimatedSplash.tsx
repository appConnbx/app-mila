import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { C } from '../theme'

/**
 * Abertura do app: o logo (M) CRESCE e assenta; ao chegar no tamanho, dois
 * fachos de luz varrem o badge (brilho/reflexo). Depois fica num leve pulso
 * enquanto a sessão/idioma carregam. Sucede o splash nativo (mesmo badge).
 */
export function AnimatedSplash() {
  const grow = useRef(new Animated.Value(0)).current // crescimento inicial
  const shine = useRef(new Animated.Value(0)).current // varredura dos fachos
  const idle = useRef(new Animated.Value(0)).current // pulso após assentar
  const word = useRef(new Animated.Value(0)).current // wordmark entra

  useEffect(() => {
    Animated.sequence([
      Animated.timing(grow, { toValue: 1, duration: 480, easing: Easing.out(Easing.back(1.7)), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(word, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(shine, { toValue: 1, duration: 760, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(idle, { toValue: 1, duration: 820, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(idle, { toValue: 0, duration: 820, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ).start()
    })
  }, [grow, shine, idle, word])

  const growScale = grow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
  const growOpacity = grow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] })
  const idleScale = idle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] })
  const glowOpacity = idle.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.4] })
  // Fachos: o grupo (dois feixes) varre da esquerda p/ a direita do badge.
  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-70, 120] })
  const shineOpacity = shine.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 1, 1, 0] })
  const wordOpacity = word
  const wordY = word.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.badgeBox, { opacity: growOpacity, transform: [{ scale: Animated.multiply(growScale, idleScale) }] }]}>
        <Animated.View style={[s.glow, { opacity: glowOpacity }]} />
        <View style={s.mark}>
          <Text style={s.markM}>M</Text>
          {/* Fachos de luz varrendo o badge (clipados ao badge por overflow) */}
          <Animated.View style={[s.shineGroup, { opacity: shineOpacity, transform: [{ translateX: shineX }, { rotate: '20deg' }] }]}>
            <View style={[s.beam, { width: 16 }]} />
            <View style={[s.beam, { width: 9, marginLeft: 14, opacity: 0.55 }]} />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.Text style={[s.brand, { opacity: wordOpacity, transform: [{ translateY: wordY }] }]}>appMila</Animated.Text>
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
  shineGroup: { position: 'absolute', top: -40, bottom: -40, flexDirection: 'row', alignItems: 'center' },
  beam: { height: 200, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 8 },
  brand: { color: C.white, fontWeight: '800', fontSize: 26, letterSpacing: 2 },
})
