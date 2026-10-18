/**
 * Biomechanical Muscle Recovery, Fatigue & Retained Strength Engine
 * Ported from Open-Gym's recovery.js & Stats.jsx
 */

import {
  MUSCLES,
  type MuscleSlug,
  calculateMuscleLoad,
  getExerciseMuscleWeights,
  type ExerciseLoadItem,
  type ThresholdRule,
} from './muscles'

// Half-life in milliseconds
const HL_24H = 24 * 60 * 60 * 1000
const HL_30H = 30 * 60 * 60 * 1000
const HL_48H = 48 * 60 * 60 * 1000

export const FATIGUE_HALF_LIFE_BY_MUSCLE: Record<MuscleSlug, number> = {
  trapezius: HL_30H,
  deltoids: HL_24H,
  chest: HL_30H,
  'upper-back': HL_30H,
  serratus: HL_24H,
  biceps: HL_24H,
  triceps: HL_24H,
  forearm: HL_24H,
  abs: HL_24H,
  obliques: HL_24H,
  'lower-back': HL_48H,
  gluteal: HL_48H,
  quadriceps: HL_48H,
  hamstring: HL_48H,
  adductors: HL_48H,
  'hip-flexors': HL_24H,
  calves: HL_48H,
  tibialis: HL_24H,
}

/** Period after training during which retained strength remains at full value (14 days). */
export const STRENGTH_FULL_MS = 14 * 24 * 60 * 60 * 1000

/** Exponential half-life for retained strength after the full-retention period (28 days). */
export const STRENGTH_HALF_LIFE_MS = 28 * 24 * 60 * 60 * 1000

/** Minimum retained-strength value for an untrained or fully detrained muscle. */
export const STRENGTH_FLOOR = 0.5

export const FATIGUE_LEVELS: ThresholdRule[] = [
  { at: 0, level: 0 },
  { at: 0.15, level: 1 },
  { at: 0.25, level: 2 },
  { at: 0.4, level: 3 },
  { at: 0.55, level: 4, exclusive: true },
]

export const STRENGTH_LEVELS: ThresholdRule[] = [
  { at: STRENGTH_FLOOR, level: 0 },
  { at: 0.625, level: 1 },
  { at: 0.75, level: 2 },
  { at: 0.875, level: 3 },
  { at: 1, level: 4 },
]

export type FatigueState = 'ready' | 'recovering' | 'fatigued'

export interface MuscleRecoveryStatus {
  muscle: MuscleSlug
  fatigueScore: number // 0.0 (rested) to 1.0+ (exhausted)
  state: FatigueState
  hoursToReady: number // hours until fatigue <= 0.25
  percentageRecovered: number // 0% to 100%
}

export interface WorkoutHistoryEntry {
  timestamp: number // epoch ms
  items: ExerciseLoadItem[]
}

const SETS_PER_FATIGUE_UNIT = 8
const MAX_SETS_CAP = 12

export function halfLifeDecay(ageMs: number, halfLifeMs: number): number {
  return 0.5 ** (ageMs / halfLifeMs)
}

export function weeksSinceTraining(nowMs: number, lastTrainedMs: number): number {
  return Math.max(0, Math.floor((nowMs - lastTrainedMs) / 86400000 / 7))
}

export function computeMuscleRecovery(
  history: WorkoutHistoryEntry[],
  nowMs: number = Date.now(),
): Record<MuscleSlug, MuscleRecoveryStatus> {
  const accumulatedFatigue: Partial<Record<MuscleSlug, number>> = {}

  for (const m of MUSCLES) {
    accumulatedFatigue[m] = 0
  }

  // Scan workouts within the last 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const recentWorkouts = [...history]
    .filter((w) => w.timestamp <= nowMs && nowMs - w.timestamp <= thirtyDaysMs)
    .sort((a, b) => a.timestamp - b.timestamp)

  for (const workout of recentWorkouts) {
    const elapsedMs = nowMs - workout.timestamp
    if (elapsedMs < 0) continue

    const load = calculateMuscleLoad(workout.items)

    for (const m of MUSCLES) {
      const sets = Math.min(load[m] || 0, MAX_SETS_CAP)
      if (sets <= 0) continue

      const initialStimulus = sets / SETS_PER_FATIGUE_UNIT
      const hl = FATIGUE_HALF_LIFE_BY_MUSCLE[m]
      const decayedStimulus = initialStimulus * halfLifeDecay(elapsedMs, hl)

      accumulatedFatigue[m] = (accumulatedFatigue[m] || 0) + decayedStimulus
    }
  }

  const results: Partial<Record<MuscleSlug, MuscleRecoveryStatus>> = {}

  for (const m of MUSCLES) {
    const rawValue = accumulatedFatigue[m] || 0
    // Saturating fatigue level (1 - exp(-v)) as in Open-Gym recovery.js when multiple sessions stack,
    // while keeping single-session linearity intuitive
    const fatigue = rawValue > 1.2 ? 1 - Math.exp(-rawValue) : rawValue
    let state: FatigueState = 'ready'
    if (fatigue > 0.5) {
      state = 'fatigued'
    } else if (fatigue >= 0.25) {
      state = 'recovering'
    }

    const hl = FATIGUE_HALF_LIFE_BY_MUSCLE[m]
    let hoursToReady = 0
    if (fatigue > 0.25) {
      const ratio = fatigue / 0.25
      const msNeeded = hl * (Math.log(ratio) / Math.LN2)
      hoursToReady = Math.max(0, Math.round(msNeeded / (3600 * 1000)))
    }

    const recoveryPct = Math.min(
      100,
      Math.max(0, Math.round((1 - Math.min(1, fatigue)) * 100)),
    )

    results[m] = {
      muscle: m,
      fatigueScore: Number(fatigue.toFixed(2)),
      state,
      hoursToReady,
      percentageRecovered: recoveryPct,
    }
  }

  return results as Record<MuscleSlug, MuscleRecoveryStatus>
}

export function computeRetainedStrength(
  history: WorkoutHistoryEntry[],
  nowMs: number = Date.now(),
): {
  strengthByMuscle: Record<MuscleSlug, number>
  lastTrainedAt: Partial<Record<MuscleSlug, number>>
} {
  const latest: Partial<Record<MuscleSlug, number>> = {}

  for (const workout of history || []) {
    if (!Number.isFinite(workout.timestamp) || workout.timestamp > nowMs) continue
    for (const item of workout.items || []) {
      if (!item.sets || item.sets <= 0) continue
      const weights = getExerciseMuscleWeights(item.exercise)
      for (const slug of Object.keys(weights) as MuscleSlug[]) {
        if ((weights[slug] || 0) > 0) {
          if (latest[slug] == null || workout.timestamp > latest[slug]!) {
            latest[slug] = workout.timestamp
          }
        }
      }
    }
  }

  const strengthByMuscle: Partial<Record<MuscleSlug, number>> = {}
  for (const m of MUSCLES) {
    const lastTs = latest[m]
    if (lastTs == null || !Number.isFinite(lastTs)) {
      strengthByMuscle[m] = STRENGTH_FLOOR
      continue
    }
    const age = nowMs - lastTs
    if (age <= STRENGTH_FULL_MS) {
      strengthByMuscle[m] = 1
    } else {
      strengthByMuscle[m] = Math.max(
        STRENGTH_FLOOR,
        Number(
          halfLifeDecay(age - STRENGTH_FULL_MS, STRENGTH_HALF_LIFE_MS).toFixed(3),
        ),
      )
    }
  }

  return {
    strengthByMuscle: strengthByMuscle as Record<MuscleSlug, number>,
    lastTrainedAt: latest,
  }
}


