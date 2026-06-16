import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { C } from '../theme'

/**
 * Tela de carregamento da abertura do app: o "M" da marca pulsa (escala + leve
 * glow) enquanto a sessão e o idioma carregam. Sucede o splash nativo (mesmo
 * badge sobre fundo escuro), então a transição é imperceptível.
 */
export function AnimatedSplash() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] })
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.5] })

  return (
    <View style={s.wrap}>
      <View style={s.center}>
        <Animated.View style={[s.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
        <Animated.View style={[s.mark, { transform: [{ scale }] }]}>
          <Text style={s.markM}>M</Text>
        </Animated.View>
      </View>
      <Text style={s.brand}>appMila</Text>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 22 },
  center: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 110, height: 110, borderRadius: 32, backgroundColor: C.cyan },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markM: { color: C.bg, fontWeight: '900', fontSize: 48 },
  brand: { color: C.white, fontWeight: '800', fontSize: 26, letterSpacing: 2 },
})
