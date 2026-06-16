import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '../api'
import { t, useLang } from '../i18n'
import { C } from '../theme'

export function Login() {
  useLang() // re-renderiza se o idioma mudar
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    if (!email.trim() || !password) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (err) setError(t('badCredentials'))
  }

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.brandRow}>
        <View style={s.mark}>
          <Text style={s.markM}>M</Text>
        </View>
        <Text style={s.brand}>appMila</Text>
      </View>
      <Text style={s.tagline}>{t('appTagline')}</Text>
      <Text style={s.hint}>{t('loginHint')}</Text>

      <TextInput
        style={s.input}
        placeholder={t('email')}
        placeholderTextColor={C.faint}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder={t('password')}
        placeholderTextColor={C.faint}
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={signIn}
      />
      <Pressable style={[s.btn, busy && s.btnBusy]} onPress={signIn} disabled={busy}>
        <Text style={s.btnText}>{busy ? t('signingIn') : t('signIn')}</Text>
      </Pressable>
      {error && <Text style={s.error}>{error}</Text>}
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markM: { color: C.bg, fontWeight: '900', fontSize: 24 },
  brand: { color: C.white, fontWeight: '800', fontSize: 28, letterSpacing: 2 },
  tagline: { color: C.muted, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  hint: { color: C.muted, fontSize: 13, marginBottom: 10 },
  input: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: C.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: C.cyan,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnBusy: { opacity: 0.6 },
  btnText: { color: C.bg, fontWeight: '700', fontSize: 15 },
  error: { color: C.redText, marginTop: 10, textAlign: 'center', fontSize: 13 },
})
