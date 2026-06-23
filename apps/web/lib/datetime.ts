/**
 * Formatação de datas/horas no fuso da instância (holding).
 * - Valores "date-only" (YYYY-MM-DD, ex.: prazo) são tratados como data de
 *   calendário (sem deslocar o dia pelo fuso).
 * - Timestamps (com hora) são convertidos para o fuso informado.
 */
function parse(iso: string): { d: Date; dateOnly: boolean } {
  const dateOnly = iso.length <= 10;
  return { d: new Date(dateOnly ? iso + "T00:00:00Z" : iso), dateOnly };
}

const FALLBACK_TZ = "America/Sao_Paulo";

/** dd/mm/aaaa */
export function fmtDate(iso: string | null | undefined, locale: string, tz?: string): string {
  if (!iso) return "—";
  const { d, dateOnly } = parse(iso);
  return new Intl.DateTimeFormat(locale, {
    timeZone: dateOnly ? "UTC" : tz || FALLBACK_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** dd/mm */
export function fmtDayMonth(iso: string | null | undefined, locale: string, tz?: string): string {
  if (!iso) return "—";
  const { d, dateOnly } = parse(iso);
  return new Intl.DateTimeFormat(locale, {
    timeZone: dateOnly ? "UTC" : tz || FALLBACK_TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

/** dd/mm/aaaa hh:mm (no fuso da instância) */
export function fmtDateTime(iso: string | null | undefined, locale: string, tz?: string): string {
  if (!iso) return "—";
  const { d } = parse(iso);
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz || FALLBACK_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Lista curada de fusos para o seletor da instância. */
export const TIMEZONES: string[] = [
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Manaus",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Santiago",
  "America/New_York",
  "America/Mexico_City",
  "Europe/Lisbon",
  "Europe/Madrid",
  "UTC",
];
