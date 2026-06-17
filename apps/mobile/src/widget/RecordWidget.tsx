import { FlexWidget, SvgWidget } from 'react-native-android-widget'

// Cores da marca (literais; o widget nativo exige cor no formato #RRGGBB[AA]).
const CYAN = '#22D3EE'
const DARK = '#0F172A'
// Microfone (mesma forma do app). Cor escura sobre o círculo ciano.
const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${DARK}"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>`

/**
 * Widget de tela inicial (Android): botão de microfone. Ao tocar, abre o
 * appMila no deep link mila://record — que cai direto no gravador de voz.
 * (Android não permite gravar áudio nem animar dentro do widget; a gravação
 * e a animação acontecem no app, a um toque daqui.)
 */
export function RecordWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'mila://record' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000000',
      }}
    >
      <FlexWidget
        style={{
          height: 96,
          width: 96,
          borderRadius: 48,
          backgroundColor: CYAN,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <SvgWidget svg={MIC_SVG} style={{ height: 46, width: 46 }} />
      </FlexWidget>
    </FlexWidget>
  )
}
