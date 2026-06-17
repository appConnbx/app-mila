import { FlexWidget, TextWidget } from 'react-native-android-widget'

// Cores da marca (literais; o widget nativo exige cor no formato #RRGGBB[AA]).
const CYAN = '#22D3EE'
const DARK = '#0F172A'
const LIGHT = '#E2E8F0'
const BORDER = '#22D3EE66' // ciano 40%

/**
 * Widget de tela inicial (Android): tile escuro com o badge M da marca e o
 * rótulo "Nova demanda". Ao tocar, abre o app no deep link mila://record
 * (gravador de voz).
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
          borderRadius: 16,
          backgroundColor: CYAN,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text="M" style={{ fontSize: 38, fontWeight: 'bold', color: DARK }} />
      </FlexWidget>
      <TextWidget text="Nova demanda" style={{ fontSize: 12, fontWeight: 'bold', color: LIGHT, marginTop: 8 }} />
    </FlexWidget>
  )
}
