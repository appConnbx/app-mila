import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget'

// Cores da marca (literais; o widget nativo exige cor no formato #RRGGBB[AA]).
const CYAN = '#22D3EE'
const DARK = '#0F172A'
const LIGHT = '#E2E8F0'
const BORDER = '#22D3EE66' // ciano 40%

// Microfone (mesma forma do app). Cor escura sobre o círculo ciano.
const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${DARK}"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>`

/**
 * Widget de tela inicial (Android): tile escuro com a cara do appMila —
 * microfone ciano em destaque + rótulo "Gravar". Ao tocar, abre o app no
 * deep link mila://record (cai direto no gravador de voz).
 */
export function RecordWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'mila://record' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DARK,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 8,
      }}
    >
      <FlexWidget
        style={{
          height: 60,
          width: 60,
          borderRadius: 30,
          backgroundColor: CYAN,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <SvgWidget svg={MIC_SVG} style={{ height: 32, width: 32 }} />
      </FlexWidget>
      <TextWidget text="Gravar" style={{ fontSize: 13, fontWeight: 'bold', color: LIGHT, marginTop: 8 }} />
    </FlexWidget>
  )
}
