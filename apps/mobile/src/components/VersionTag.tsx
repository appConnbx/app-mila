import * as Application from "expo-application";
import { type StyleProp, StyleSheet, Text, type TextStyle } from "react-native";
import { C } from "../theme";

/** Rótulo discreto da versão em execução: "appMila v1.0.0 (build 7)".
 *  O número entre parênteses é o versionCode (muda a cada publicação) —
 *  serve para confirmar que a atualização realmente entrou. */
export function VersionTag({ style }: { style?: StyleProp<TextStyle> }) {
  const v = Application.nativeApplicationVersion ?? "—";
  const b = Application.nativeBuildVersion ?? "—";
  return (
    <Text style={[s.t, style]}>
      appMila v{v} (build {b})
    </Text>
  );
}

const s = StyleSheet.create({
  t: { color: C.faint, fontSize: 11 },
});
