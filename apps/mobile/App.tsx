import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { getLocales } from 'expo-localization'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './src/api'
import { initLang } from './src/i18n'
import { Login } from './src/screens/Login'
import { Home } from './src/screens/Home'
import { AnimatedSplash } from './src/components/AnimatedSplash'
import { C } from './src/theme'

export default function App() {
  const [ready, setReady] = useState(false)
  const [splashMin, setSplashMin] = useState(false) // tempo mínimo p/ o intro tocar
  const [session, setSession] = useState<Session | null>(null)
  const [recordSignal, setRecordSignal] = useState(0)
  const url = Linking.useURL()

  useEffect(() => {
    void (async () => {
      await initLang(getLocales()[0]?.languageTag ?? null)
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setReady(true)
    })()
    // Garante que a abertura (crescer + varredura de luz) sempre apareça.
    const t = setTimeout(() => setSplashMin(true), 1500)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => {
      clearTimeout(t)
      sub.subscription.unsubscribe()
    }
  }, [])

  // Deep link do widget/atalho (mila://record): abre o gravador de voz.
  useEffect(() => {
    if (url && url.includes('record')) setRecordSignal((n) => n + 1)
  }, [url])

  return (
    <SafeAreaProvider>
      <View style={s.root}>
        <StatusBar style="light" />
        {!ready || !splashMin ? (
          <AnimatedSplash />
        ) : session ? (
          <Home openRecordSignal={recordSignal} />
        ) : (
          <Login />
        )}
      </View>
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
})
