import Svg, { Path, Rect } from "react-native-svg";

// Ícones do padrão appMila (mesmas formas do sistema web e do agente desktop).
type IconProps = { size?: number; color: string };

/** Microfone — mesma forma do agente desktop. */
export function MicIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
    </Svg>
  );
}

/** Play — começar a trabalhar. */
export function PlayIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5.5v13a1 1 0 0 0 1.52.86l10.2-6.5a1 1 0 0 0 0-1.72L9.52 4.64A1 1 0 0 0 8 5.5z" />
    </Svg>
  );
}

/** Pause — voltar para nova. */
export function PauseIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={6.5} y={5} width={4} height={14} rx={1.2} />
      <Rect x={13.5} y={5} width={4} height={14} rx={1.2} />
    </Svg>
  );
}

/** Check — concluir (mesmo traço do web: M5 10.5l3 3 7-7). */
export function CheckIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 10.5l4 4 8-8"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** X — recusar. */
export function XIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
