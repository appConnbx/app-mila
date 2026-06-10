/**
 * "Chama" (streak de dias ativos). Um dia útil sem atividade apaga a chama.
 * Fins de semana e feriados nacionais NÃO contam (não apagam a chama).
 * Atividade = ao menos 1 demanda concluída no dia (completed > 0).
 */

export type DailyPoint = { day: string; completed: number }

/** Domingo de Páscoa (algoritmo de Gauss/Anonymous Gregorian). */
function easter(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

const FIXED = new Set([
  '01-01', // Confraternização
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // N. Sra. Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Consciência Negra (nacional desde 2024)
  '12-25', // Natal
])

function mmdd(d: Date) {
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** Feriados móveis nacionais (sexta santa) + facultativos comuns (carnaval, corpus christi). */
function movableHolidays(year: number): Set<string> {
  const e = easter(year)
  const add = (offset: number) => iso(new Date(e.getTime() + offset * 86400000))
  return new Set([
    add(-48), // Carnaval (segunda)
    add(-47), // Carnaval (terça)
    add(-2), // Sexta-feira Santa
    add(60), // Corpus Christi
  ])
}

const movableCache = new Map<number, Set<string>>()
function movableFor(year: number) {
  let s = movableCache.get(year)
  if (!s) {
    s = movableHolidays(year)
    movableCache.set(year, s)
  }
  return s
}

export function isBrHoliday(d: Date): boolean {
  return FIXED.has(mmdd(d)) || movableFor(d.getUTCFullYear()).has(iso(d))
}

/** Dia que NÃO conta para a chama (fim de semana ou feriado nacional). */
export function isSkippedDay(d: Date): boolean {
  const wd = d.getUTCDay() // 0 dom, 6 sáb
  return wd === 0 || wd === 6 || isBrHoliday(d)
}

/**
 * Conta dias úteis consecutivos com atividade, do mais recente para trás.
 * O último ponto do array é "hoje": se hoje é dia útil sem atividade ainda,
 * não quebra a chama (o dia ainda está em andamento).
 */
/** Chama a partir de uma lista de dias com atividade (ISO YYYY-MM-DD). */
export function streakFromDates(activeDays: string[]): number {
  const set = new Set(activeDays)
  const today = new Date()
  const daily: DailyPoint[] = []
  for (let i = 59; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
    const iso = d.toISOString().slice(0, 10)
    daily.push({ day: iso, completed: set.has(iso) ? 1 : 0 })
  }
  return computeStreak(daily)
}

export function computeStreak(daily: DailyPoint[]): number {
  let streak = 0
  for (let i = daily.length - 1; i >= 0; i--) {
    const d = new Date(`${daily[i].day}T12:00:00Z`)
    const isToday = i === daily.length - 1
    if (isSkippedDay(d)) continue // fim de semana/feriado: não conta nem quebra
    if (daily[i].completed > 0) {
      streak++
    } else if (isToday) {
      continue // hoje em andamento, sem atividade ainda
    } else {
      break // dia útil passado sem atividade → apaga
    }
  }
  return streak
}
