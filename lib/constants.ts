/**
 * Zona horaria IANA para contar entrenos “antes de las 8:00” (hitos tipo Guerrero Madrugador).
 * En servidor: `ACHIEVEMENTS_EARLY_TZ`. En cliente (si hiciera falta): `NEXT_PUBLIC_ACHIEVEMENTS_EARLY_TZ`.
 */
export function getAchievementsEarlyWorkoutTimezone(): string {
  if (typeof process !== 'undefined' && process.env.ACHIEVEMENTS_EARLY_TZ) {
    return process.env.ACHIEVEMENTS_EARLY_TZ
  }
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ACHIEVEMENTS_EARLY_TZ) {
    return process.env.NEXT_PUBLIC_ACHIEVEMENTS_EARLY_TZ
  }
  return 'Europe/Madrid'
}

/** Etiquetas en español para valores de goal en clients/profiles */
export const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Pérdida de grasa',
  muscle_gain: 'Ganar masa muscular',
  toning: 'Fuerza',
  endurance: 'Resistencia',
  maintenance: 'Bienestar general',
}

export function getGoalLabel(goal: string | null | undefined): string {
  if (!goal) return '-'
  return GOAL_LABELS[goal] ?? goal
}

export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export function normalizeRoutineLevel(
  level: string | null | undefined,
): 'beginner' | 'intermediate' | 'advanced' | '' {
  if (!level) return ''
  const v = level.trim().toLowerCase()
  if (v === 'beginner' || v === 'principiante') return 'beginner'
  if (v === 'intermediate' || v === 'intermedio') return 'intermediate'
  if (v === 'advanced' || v === 'avanzado') return 'advanced'
  return ''
}

export function getLevelLabel(level: string | null | undefined): string {
  if (!level) return 'No especificado'
  const key = level.trim().toLowerCase()
  return LEVEL_LABELS[key] ?? level
}

export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-25b160e13c63420783953a1098e3168c.r2.dev'

