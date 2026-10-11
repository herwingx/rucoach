import { describe, expect, it } from 'vitest'
import {
  BENCH_BENCHMARK_EXERCISE_IDS,
  DEADLIFT_BENCHMARK_EXERCISE_IDS,
  OHP_BENCHMARK_EXERCISE_IDS,
  SQUAT_BENCHMARK_EXERCISE_IDS,
  liftBenchmarkKind,
} from '@/lib/achievement-rules'
import {
  computeCareerTonnageComparison,
  computeSymmetryStandards,
} from '@/lib/achievements-ui'

describe('liftBenchmarkKind', () => {
  it('classifies by canonical exercise ids', () => {
    expect(liftBenchmarkKind('25', null)).toBe('bench')
    expect(SQUAT_BENCHMARK_EXERCISE_IDS.has('43')).toBe(true)
    expect(liftBenchmarkKind('43', null)).toBe('squat')
    expect(liftBenchmarkKind('32', null)).toBe('deadlift')
    expect(liftBenchmarkKind('117', null)).toBe('deadlift')
    expect(OHP_BENCHMARK_EXERCISE_IDS.has('91')).toBe(true)
    expect(liftBenchmarkKind('91', null)).toBe('ohp')
    expect(BENCH_BENCHMARK_EXERCISE_IDS.has('25')).toBe(true)
    expect(DEADLIFT_BENCHMARK_EXERCISE_IDS.has('32')).toBe(true)
  })

  it('returns null for unknown id without a matching name', () => {
    expect(liftBenchmarkKind('99999', null)).toBe(null)
    expect(liftBenchmarkKind('99999', '')).toBe(null)
  })

  it('falls back to English and Spanish exercise names when id is unknown', () => {
    expect(liftBenchmarkKind('x', 'barbell bench press')).toBe('bench')
    expect(liftBenchmarkKind('x', 'Press de banca con barra')).toBe('bench')
    expect(liftBenchmarkKind('x', 'Barbell Incline Bench Press')).toBe(null)
    expect(liftBenchmarkKind('x', 'Press de banca inclinado')).toBe(null)
    expect(liftBenchmarkKind('x', 'barbell full squat')).toBe('squat')
    expect(liftBenchmarkKind('x', 'Sentadilla libre con barra')).toBe('squat')
    expect(liftBenchmarkKind('x', 'Sentadilla búlgara')).toBe(null)
    expect(liftBenchmarkKind('x', 'barbell deadlift')).toBe('deadlift')
    expect(liftBenchmarkKind('x', 'Peso muerto convencional')).toBe('deadlift')
    expect(liftBenchmarkKind('x', 'barbell romanian deadlift')).toBe(null)
    expect(liftBenchmarkKind('x', 'Peso muerto rumano')).toBe(null)
    expect(liftBenchmarkKind('x', 'Press militar con barra')).toBe('ohp')
  })
})

describe('computeSymmetryStandards & computeCareerTonnageComparison', () => {
  it('computes relative strength tiers and next kg targets accurately', () => {
    const overview = computeSymmetryStandards({
      totalSessions: 40,
      level: 12,
      prCount: 8,
      maxVolumeKg: 11200,
      lifetimeVolumeKg: 120000,
      earlyWorkouts: 3,
      measurementMonthStreak: 2,
      streakDays: 14,
      messagesSent: 15,
      bodyWeightKg: 80,
      bench1RmKg: 84,
      squat1RmKg: 120,
      deadlift1RmKg: 140,
      ohp1RmKg: 52,
      benchBwPercent: 105,
      squatBwPercent: 150,
      deadliftBwPercent: 175,
      ohpBwPercent: 65,
    })

    expect(overview.bodyWeightKg).toBe(80)
    const bench = overview.lifts.find((l) => l.key === 'bench')!
    expect(bench.currentTier).toBe('rare') // 1.0x Plata achieved
    expect(bench.nextTierLabel).toBe('Oro')
    expect(bench.nextTargetKg).toBe(100) // 1.25 * 80 = 100 kg
    expect(bench.kgNeededForNext).toBe(16) // 100 - 84 = 16 kg

    const squat = overview.lifts.find((l) => l.key === 'squat')!
    expect(squat.currentTier).toBe('epic') // 1.5x Oro achieved
    expect(squat.nextTierLabel).toBe('Élite')
    expect(squat.nextTargetKg).toBe(160) // 2.0 * 80 = 160 kg

    const tonnage = computeCareerTonnageComparison(120000)
    expect(tonnage.nextMilestoneLabel).toBe('250 Toneladas')
    expect(tonnage.progressPercent).toBe(48)
  })
})

