/**
 * Smart Search & Similar Exercise Engine for RU Coach
 * Ported and enhanced from openGym's fuzzy search, synonym vocabulary,
 * and Damerau-Levenshtein distance algorithm.
 */

import type { Exercise } from '@/lib/types'
import { exName, exEquipment, exBodyParts, exTargetMuscles } from '@/lib/exercise-i18n'

export function normalizeSearchText(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Gym shorthand, abbreviations, and bilingual synonyms (ES <-> EN)
const SYNONYMS: Record<string, string[]> = {
  // Free weights & equipment
  db: ['dumbbell', 'mancuerna', 'mancuernas'],
  dbs: ['dumbbell', 'mancuerna', 'mancuernas'],
  mancuerna: ['dumbbell', 'mancuerna'],
  mancuernas: ['dumbbell', 'mancuerna'],
  bb: ['barbell', 'barra'],
  barra: ['barbell', 'barra'],
  kb: ['kettlebell', 'pesa rusa'],
  kbs: ['kettlebell', 'pesa rusa'],
  kettlebell: ['pesa rusa', 'kettlebell'],
  ez: ['ez barbell', 'barra z', 'barra ez'],
  sm: ['smith machine', 'smith', 'multipower'],
  multipower: ['smith machine', 'smith', 'multipower'],
  bw: ['body weight', 'bodyweight', 'peso corporal'],
  bodyweight: ['body weight', 'peso corporal', 'calistenia'],
  corporal: ['body weight', 'peso corporal'],
  polea: ['cable', 'polea'],
  cable: ['cable', 'polea'],

  // Big lifts & patterns
  sq: ['squat', 'sentadilla'],
  squat: ['sentadilla', 'squat'],
  sentadilla: ['squat', 'sentadilla'],
  bp: ['bench press', 'press banca', 'press de banca'],
  bench: ['bench press', 'press banca'],
  banca: ['press banca', 'bench press'],
  ohp: ['overhead press', 'shoulder press', 'press militar', 'press hombro'],
  militar: ['press militar', 'overhead press', 'shoulder press'],
  rdl: ['romanian deadlift', 'peso muerto rumano'],
  dl: ['deadlift', 'peso muerto'],
  sldl: ['stiff leg deadlift', 'peso muerto piernas rigidas'],
  deadlift: ['peso muerto', 'deadlift'],
  pesomuerto: ['peso muerto', 'deadlift'],
  pullup: ['pull up', 'pull-up', 'dominada', 'dominadas'],
  dominada: ['pull up', 'chin up', 'dominadas'],
  dominadas: ['pull up', 'chin up', 'dominadas'],
  chinup: ['chin up', 'chin-up', 'dominada supina'],
  pushup: ['push up', 'push-up', 'flexion', 'flexiones', 'lagartijas'],
  flexion: ['push up', 'flexiones'],
  flexiones: ['push up', 'flexiones'],
  fondos: ['dips', 'chest dip', 'triceps dip', 'fondos'],
  dips: ['fondos', 'dips'],
  remo: ['row', 'remo'],
  row: ['row', 'remo'],
  jalon: ['lat pulldown', 'jalon', 'jalon al pecho'],
  pulldown: ['lat pulldown', 'pulldown', 'jalon'],
  prensa: ['leg press', 'prensa', 'prensa 45'],
  legpress: ['leg press', 'prensa'],
  aperturas: ['chest fly', 'fly', 'aperturas', 'peck deck'],
  fly: ['fly', 'aperturas', 'peck deck'],
  flyes: ['fly', 'aperturas'],
  skullcrusher: ['lying triceps extension', 'skull crusher', 'press frances'],
  frances: ['skull crusher', 'lying triceps extension', 'press frances'],
  hipthrust: ['hip thrust', 'empuje de cadera'],
  elevaciones: ['lateral raise', 'front raise', 'elevaciones laterales'],

  // Muscle aliases
  pecho: ['chest', 'pecho', 'pectoral', 'pectorales'],
  chest: ['pecho', 'chest', 'pectoral'],
  espalda: ['back', 'espalda', 'dorsal', 'lats'],
  lats: ['latissimus', 'dorsal', 'espalda', 'pulldown'],
  dorsal: ['lats', 'latissimus', 'espalda'],
  hombro: ['shoulder', 'deltoids', 'deltoides', 'hombro'],
  deltoides: ['deltoids', 'shoulder', 'hombro'],
  biceps: ['bicep', 'biceps', 'curl'],
  triceps: ['tricep', 'triceps', 'extension'],
  isquios: ['hamstring', 'hamstrings', 'isquiotibiales', 'femorales'],
  femorales: ['hamstring', 'hamstrings', 'femorales', 'curl femoral'],
  cuadriceps: ['quads', 'quadriceps', 'cuadriceps'],
  gluteos: ['glutes', 'gluteus', 'gluteo', 'gluteos'],
  gluteo: ['glutes', 'gluteus', 'gluteo'],
  gemelos: ['calves', 'calf', 'gemelos', 'pantorrillas'],
  pantorrillas: ['calves', 'calf', 'pantorrillas'],
  abs: ['abdominals', 'abs', 'abdomen', 'abdominales', 'core'],
  abdomen: ['abdominals', 'abs', 'abdomen', 'core'],
}

/**
 * Damerau-Levenshtein edit distance allowing transposition of adjacent characters
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev2: number[] | null = null
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j)

  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      if (
        prev2 &&
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        v = Math.min(v, prev2[j - 2] + 1)
      }
      cur.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = cur
  }
  return prev[b.length]
}

export function typosFor(word: string): number {
  if (word.length < 4) return 0
  if (word.length < 7) return 1
  return 2
}

function formsOf(tok: string): string[] {
  const norm = normalizeSearchText(tok)
  if (!norm) return []
  const out = [norm]

  // Add synonyms
  const syns = SYNONYMS[norm]
  if (syns) {
    for (const s of syns) out.push(normalizeSearchText(s))
  }

  // Singularize common plural suffixes in ES and EN
  if (norm.length >= 5 && norm.endsWith('es')) {
    out.push(norm.slice(0, -2))
  } else if (norm.length >= 4 && norm.endsWith('s') && !norm.endsWith('ss')) {
    out.push(norm.slice(0, -1))
  }

  return Array.from(new Set(out))
}

export interface ExerciseSearchCorpus {
  id: string
  name: string
  nameWords: string[]
  fullCorpus: string
  exercise: Partial<Exercise>
}

export function createSearchCorpus(
  exercise: Partial<Exercise>,
): ExerciseSearchCorpus {
  const ex = exercise as Exercise
  const nEs = normalizeSearchText(exName(ex))
  const nOrig = normalizeSearchText(exercise.name || '')
  const nameCombined = `${nEs} ${nOrig}`.trim()
  const nameWords = Array.from(
    new Set(nameCombined.split(/[\s\-‐-―()/,]+/).filter((w) => w.length > 0)),
  )

  const parts = [
    nEs,
    nOrig,
    normalizeSearchText(exEquipment(ex) || ''),
    normalizeSearchText(exercise.equipment || ''),
    normalizeSearchText(exercise.primary_muscle || ''),
    ...exBodyParts(ex).map(normalizeSearchText),
    ...exTargetMuscles(ex).map(normalizeSearchText),
  ]

  return {
    id: exercise.id || '',
    name: nEs || nOrig,
    nameWords,
    fullCorpus: parts.join(' '),
    exercise,
  }
}

/**
 * Score how well a token matches an exercise corpus
 */
function scoreToken(corpus: ExerciseSearchCorpus, token: string): number {
  const forms = formsOf(token)
  let best = 0

  for (const form of forms) {
    // Exact word in title
    if (corpus.nameWords.includes(form)) {
      best = Math.max(best, 100)
      continue
    }

    // Prefix of a title word (e.g. "sentad" -> "sentadilla")
    if (corpus.nameWords.some((w) => w.startsWith(form))) {
      best = Math.max(best, 85)
      continue
    }

    // Substring in title
    if (corpus.name.includes(form)) {
      best = Math.max(best, 70)
      continue
    }

    // Typo match against title words
    const maxTypos = typosFor(form)
    if (maxTypos > 0) {
      const typoHit = corpus.nameWords.some((w) => {
        if (Math.abs(w.length - form.length) > maxTypos) return false
        return editDistance(form, w, maxTypos) <= maxTypos
      })
      if (typoHit) {
        best = Math.max(best, 50)
        continue
      }
    }

    // Match in equipment / muscle corpus
    if (corpus.fullCorpus.includes(form)) {
      best = Math.max(best, 35)
    }
  }

  return best
}

/**
 * Search and rank exercises by relevance
 */
export function searchExercises<T extends Partial<Exercise>>(
  exercises: T[],
  query: string,
): T[] {
  const trimmed = query.trim()
  if (!trimmed) return exercises

  const rawTokens = normalizeSearchText(trimmed)
    .split(/\s+/)
    .filter(Boolean)
  if (rawTokens.length === 0) return exercises

  const scored: { exercise: T; score: number }[] = []

  for (const ex of exercises) {
    const corpus = createSearchCorpus(ex)
    let totalScore = 0
    let allTokensMatched = true

    for (const token of rawTokens) {
      const tokScore = scoreToken(corpus, token)
      if (tokScore === 0) {
        allTokensMatched = false
        break
      }
      totalScore += tokScore
    }

    if (allTokensMatched) {
      // Bonus: shorter title matching the exact query wins ties
      const titleLenBonus = Math.max(0, 30 - corpus.nameWords.length)
      scored.push({
        exercise: ex,
        score: totalScore + titleLenBonus,
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.exercise)
}

/**
 * Find similar / alternative exercises for substitution or recommendations
 */
export function findSimilarExercises<T extends Partial<Exercise>>(
  targetExercise: Partial<Exercise>,
  allExercises: T[],
  limit = 24,
): T[] {
  if (!targetExercise || !allExercises.length) return []

  const targetId = targetExercise.id
  const targetMuscle = normalizeSearchText(targetExercise.primary_muscle || '')
  const targetEquip = normalizeSearchText(targetExercise.equipment || '')

  const scored: { exercise: T; score: number }[] = []

  for (const ex of allExercises) {
    if (targetId && ex.id === targetId) continue

    const muscle = normalizeSearchText(ex.primary_muscle || '')
    const equip = normalizeSearchText(ex.equipment || '')

    let score = 0

    // Exact same primary muscle
    if (muscle && muscle === targetMuscle) {
      score += 100

      // Same equipment bonus
      if (equip && equip === targetEquip) {
        score += 40
      }
    }

    // Muscle weight overlap (if present from openGym enrichment)
    if (targetExercise.muscle_weights && ex.muscle_weights) {
      for (const [m, weight] of Object.entries(targetExercise.muscle_weights)) {
        const otherWeight = ex.muscle_weights[m] || 0
        score += weight * otherWeight * 50
      }
    }

    if (score > 0) {
      scored.push({ exercise: ex, score })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.exercise)
}
