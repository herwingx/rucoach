import { describe, expect, it } from 'vitest'
import { calculate1RM } from './types'
import {
  isPR,
  isPRBeatingBaseline,
  suggestWeightForTargetReps,
  applyProgressionPolicy,
} from './progression'

describe('progression helpers', () => {
  it('isPR returns true when no current PR', () => {
    expect(isPR(100, 5, null)).toBe(true)
  })

  it('isPR compares by estimated 1RM', () => {
    const current = { weight: 100, reps: 5, estimated_1rm: calculate1RM(100, 5) }
    expect(isPR(100, 6, current)).toBe(true)
    expect(isPR(95, 5, current)).toBe(false)
  })

  it('isPRBeatingBaseline: identical follow-up set in session is not a PR', () => {
    const first = { weight: 20, reps: 10, estimated_1rm: calculate1RM(20, 10) }
    expect(isPRBeatingBaseline(20, 10, null)).toBe(true)
    expect(isPRBeatingBaseline(20, 10, first)).toBe(false)
    expect(isPRBeatingBaseline(25, 10, first)).toBe(true)
  })

  it('suggestWeightForTargetReps uses estimated1RM when present', () => {
    const res = suggestWeightForTargetReps({
      estimated1RM: 120,
      targetReps: 10,
      incrementKg: 2.5,
      defaultWeightKg: 20,
    })
    expect(res.weight).toBeGreaterThan(0)
  })

  it('suggestWeightForTargetReps applies simple double progression', () => {
    const resUp = suggestWeightForTargetReps({
      lastWeight: 50,
      lastReps: 10,
      targetReps: 10,
      incrementKg: 2.5,
      defaultWeightKg: 20,
    })
    expect(resUp.weight).toBe(52.5)

    const resHold = suggestWeightForTargetReps({
      lastWeight: 50,
      lastReps: 8,
      targetReps: 10,
      incrementKg: 2.5,
      defaultWeightKg: 20,
    })
    expect(resHold.weight).toBe(50)
  })

  it('applyProgressionPolicy correctly handles linear progression and deload', () => {
    // Linear success
    const success = applyProgressionPolicy({
      policy: 'linear',
      currentWeight: 80,
      targetReps: 5,
      targetSets: 3,
      performedSets: [
        { weight: 80, reps: 5, completed: true },
        { weight: 80, reps: 5, completed: true },
        { weight: 80, reps: 5, completed: true },
      ],
      incrementKg: 2.5,
    })
    expect(success.action).toBe('increase_weight')
    expect(success.nextWeight).toBe(82.5)

    // Linear deload on 3 consecutive misses
    const deload = applyProgressionPolicy({
      policy: 'linear',
      currentWeight: 100,
      targetReps: 5,
      targetSets: 3,
      performedSets: [
        { weight: 100, reps: 4, completed: true },
        { weight: 100, reps: 3, completed: true },
        { weight: 100, reps: 3, completed: true },
      ],
      consecutiveMisses: 2,
    })
    expect(deload.action).toBe('deload')
    expect(deload.nextWeight).toBe(90) // 10% deload of 100
  })

  it('applyProgressionPolicy correctly handles double progression (rep range)', () => {
    // Hit top of range (12 reps)
    const success = applyProgressionPolicy({
      policy: 'double',
      currentWeight: 20,
      targetReps: 12,
      repsMin: 8,
      repsMax: 12,
      targetSets: 3,
      performedSets: [
        { weight: 20, reps: 12, completed: true },
        { weight: 20, reps: 12, completed: true },
        { weight: 20, reps: 12, completed: true },
      ],
      incrementKg: 2,
    })
    expect(success.action).toBe('increase_weight')
    expect(success.nextWeight).toBe(22)
    expect(success.nextReps).toBe('8-12')
  })

  it('applyProgressionPolicy handles Greyskull AMRAP bonus', () => {
    // 5+ reps over target in AMRAP set doubles the increment
    const amrapCrush = applyProgressionPolicy({
      policy: 'greyskull',
      currentWeight: 60,
      targetReps: 5,
      targetSets: 3,
      performedSets: [
        { weight: 60, reps: 5, completed: true },
        { weight: 60, reps: 5, completed: true },
        { weight: 60, reps: 10, completed: true }, // +5 reps!
      ],
      incrementKg: 2.5,
    })
    expect(amrapCrush.action).toBe('increase_weight')
    expect(amrapCrush.nextWeight).toBe(65) // +5kg instead of +2.5kg
  })
})

