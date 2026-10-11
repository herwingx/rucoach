/**
 * Reglas estables para hitos de fuerza relativa y simetría (1RM vs peso corporal).
 * IDs alineados con el catálogo ExerciseDB (columna exercises.id, texto).
 * Soporta nombres tanto en inglés como en español (incluyendo ejercicios personalizados).
 */

/** Press banca plano (referencia principal 1× BW) */
export const BENCH_BENCHMARK_EXERCISE_IDS = new Set<string>(['25'])

/** Sentadillas con barra de referencia para KPIs de sentadilla */
export const SQUAT_BENCHMARK_EXERCISE_IDS = new Set<string>([
  '42', // barbell front squat
  '43', // barbell full squat
  '46', // barbell hack squat
  '63', // barbell narrow stance squat
  '69', // barbell overhead squat
])

/** Peso muerto convencional / sumo */
export const DEADLIFT_BENCHMARK_EXERCISE_IDS = new Set<string>([
  '32', // barbell deadlift
  '117', // barbell sumo deadlift
])

/** Press militar / hombro con barra */
export const OHP_BENCHMARK_EXERCISE_IDS = new Set<string>([
  '91', // barbell seated overhead press
  '105', // barbell standing military press
])

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function nameLooksLikeBench(name: string): boolean {
  const n = normName(name)
  const isBenchEn = n.includes('bench press')
  const isBenchEs =
    n.includes('press de banca') ||
    n.includes('press banca') ||
    n.includes('press plano con barra')
  if (!isBenchEn && !isBenchEs) return false
  if (
    n.includes('incline') ||
    n.includes('inclinado') ||
    n.includes('decline') ||
    n.includes('declinado') ||
    n.includes('close-grip') ||
    n.includes('close grip') ||
    n.includes('agarre cerrado') ||
    n.includes('jm bench')
  ) {
    return false
  }
  return true
}

function nameLooksLikeSquat(name: string): boolean {
  const n = normName(name)
  const isSquatEn = n.includes('squat')
  const isSquatEs = n.includes('sentadilla')
  if (!isSquatEn && !isSquatEs) return false
  if (n.includes('bench') || n.includes('banca')) return false
  if (
    n.includes('split') ||
    n.includes('jump') ||
    n.includes('salto') ||
    n.includes('sissy') ||
    n.includes('bulgarian') ||
    n.includes('bulgara') ||
    n.includes('goblet') ||
    n.includes('copa')
  ) {
    return false
  }
  if (isSquatEs) {
    return (
      n.includes('barra') ||
      n.includes('libre') ||
      n.includes('frontal') ||
      n.includes('hack') ||
      n.includes('profunda') ||
      n === 'sentadilla'
    )
  }
  return (
    n.includes('barbell') ||
    n.includes('front squat') ||
    n.includes('full squat') ||
    n.includes('hack squat') ||
    n.includes('back squat')
  )
}

function nameLooksLikeDeadlift(name: string): boolean {
  const n = normName(name)
  const isDlEn = n.includes('deadlift')
  const isDlEs = n.includes('peso muerto')
  if (!isDlEn && !isDlEs) return false
  if (
    n.includes('romanian') ||
    n.includes('rumano') ||
    n.includes('stiff') ||
    n.includes('piernas rigidas') ||
    n.includes('single leg') ||
    n.includes('una pierna')
  ) {
    return false
  }
  return true
}

function nameLooksLikeOhp(name: string): boolean {
  const n = normName(name)
  const isOhpEn =
    n.includes('military press') ||
    n.includes('overhead press') ||
    (n.includes('barbell') && n.includes('shoulder press'))
  const isOhpEs =
    n.includes('press militar') ||
    (n.includes('press de hombro') && n.includes('barra'))
  return isOhpEn || isOhpEs
}

export type LiftBenchmarkKind = 'bench' | 'squat' | 'deadlift' | 'ohp'

/**
 * Clasifica un PR para hitos y estándares de simetría (bench / squat / deadlift / ohp).
 * Prioriza coincidencia por exercise_id; si no aplica, usa nombre (denormalizado o catálogo en ES/EN).
 */
export function liftBenchmarkKind(
  exerciseId: string,
  exerciseName: string | null | undefined,
): LiftBenchmarkKind | null {
  if (BENCH_BENCHMARK_EXERCISE_IDS.has(exerciseId)) return 'bench'
  if (SQUAT_BENCHMARK_EXERCISE_IDS.has(exerciseId)) return 'squat'
  if (DEADLIFT_BENCHMARK_EXERCISE_IDS.has(exerciseId)) return 'deadlift'
  if (OHP_BENCHMARK_EXERCISE_IDS.has(exerciseId)) return 'ohp'

  const name = exerciseName?.trim() ?? ''
  if (!name) return null
  if (nameLooksLikeBench(name)) return 'bench'
  if (nameLooksLikeSquat(name)) return 'squat'
  if (nameLooksLikeDeadlift(name)) return 'deadlift'
  if (nameLooksLikeOhp(name)) return 'ohp'
  return null
}

