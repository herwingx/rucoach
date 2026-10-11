/**
 * Orden y “siguiente día” del plan (microciclo), alineado con /client/workout/start.
 *
 * No usa calendario real (lunes/martes): solo la secuencia day_number del template.
 * Tras cada sesión **completada** con un `routine_day_id`, el siguiente entreno es el
 * día siguiente en la lista (y al final del ciclo vuelve al primero).
 *
 * **Días de descanso** (`is_rest_day`) y bloques **sin ejercicios** no cuentan como
 * “siguiente entreno”: se avanza en la rotación hasta el primer día entrenable.
 *
 * Si el asesorado falta días en la vida real, **no se salta** un día del plan: la app
 * solo mira la última sesión completada; el siguiente entreno sigue siendo “el que toca
 * en la rotación”. (No hay recálculo por “semana” ni por días sin ir.)
 *
 * `routine_days.day_name` (p. ej. “Martes”) es etiqueta del bloque en el template, no
 * “el próximo martes” en el calendario — mostrarlo como fecha confunde si hoy es otro día.
 */

export type RoutineDayLike = {
  id: string
  day_number?: number | null
  is_rest_day?: boolean | null
  /** Si viene en el payload, un array vacío se trata como no entrenable (misma idea que descanso). */
  routine_exercises?: readonly unknown[] | null
}

export function sortRoutineDaysByDayNumber<T extends RoutineDayLike>(days: T[]): T[] {
  return [...days].sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
}

export function isTrainableRoutineDay(d: RoutineDayLike | undefined): boolean {
  if (!d) return false
  if (d.is_rest_day === true) return false
  const re = d.routine_exercises
  if (re !== undefined && re !== null) {
    const len = Array.isArray(re) ? re.length : 0
    if (len === 0) return false
  }
  return true
}

/** Primer índice en `sorted` a partir de `startIdx` (con wrap) que sea entrenable. */
function firstTrainableIndexFrom<T extends RoutineDayLike>(sorted: T[], startIdx: number): number | null {
  const n = sorted.length
  if (n === 0) return null
  for (let i = 0; i < n; i++) {
    const j = (startIdx + i) % n
    if (isTrainableRoutineDay(sorted[j])) return j
  }
  return null
}

/**
 * Siguiente bloque **entrenable** del ciclo tras la última sesión completada.
 * `null` si no hay ningún día entrenable en la rutina (p. ej. todo descanso o sin ejercicios).
 */
export function getNextRoutineDayIndex(
  sortedDays: RoutineDayLike[],
  lastCompletedRoutineDayId: string | null | undefined,
): number | null {
  if (!sortedDays.length) return null
  let raw = 0
  if (lastCompletedRoutineDayId) {
    const lastIdx = sortedDays.findIndex((d) => d.id === lastCompletedRoutineDayId)
    if (lastIdx === -1) raw = 0
    else raw = (lastIdx + 1) % sortedDays.length
  }
  return firstTrainableIndexFrom(sortedDays, raw)
}

export function getNextRoutineDay<T extends RoutineDayLike>(
  days: T[] | null | undefined,
  lastCompletedRoutineDayId: string | null | undefined,
): T | null {
  const sorted = sortRoutineDaysByDayNumber(days || [])
  if (!sorted.length) return null
  const idx = getNextRoutineDayIndex(sorted, lastCompletedRoutineDayId)
  if (idx === null) return null
  return sorted[idx] ?? null
}

/**
 * Devuelve `true` si al completar `lastCompletedRoutineDayId`, el ciclo
 * da la vuelta (el siguiente día entrenable tiene un índice menor o igual
 * al recién completado, o no hay más).
 */
export function didCompleteMicrocycle(
  sortedDays: RoutineDayLike[],
  lastCompletedRoutineDayId: string,
): boolean {
  if (!sortedDays.length) return false
  const lastIdx = sortedDays.findIndex((d) => d.id === lastCompletedRoutineDayId)
  if (lastIdx === -1) return false
  
  const nextIdx = getNextRoutineDayIndex(sortedDays, lastCompletedRoutineDayId)
  if (nextIdx === null) return true // No hay más días entrenables
  
  return nextIdx <= lastIdx // Si dio la vuelta al array
}
