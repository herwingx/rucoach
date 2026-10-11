/**
 * Deterministic, threshold-based insights for the client progress sidebar.
 * Uses medians and wider windows where possible to reduce noise from a single hard session.
 */

export function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export type VolumeInsight =
  | { status: 'insufficient'; sessionsWithVolume: number; needed: number }
  | {
      status: 'ok'
      direction: 'up' | 'down' | 'stable'
      diffPct: number
      recentMedian: number
      priorMedian: number
      window: '4v4' | '3v3'
    }

/** Positive-only volumes in chronological order (caller should sort sessions by time). */
export function computeVolumeInsightFromVolumes(volumes: number[]): VolumeInsight {
  const clean = volumes.filter((v) => Number.isFinite(v) && v > 0)
  if (clean.length < 6) {
    return { status: 'insufficient', sessionsWithVolume: clean.length, needed: 6 }
  }

  let recent: number[]
  let prior: number[]
  let window: '4v4' | '3v3'
  if (clean.length >= 8) {
    recent = clean.slice(-4)
    prior = clean.slice(-8, -4)
    window = '4v4'
  } else {
    recent = clean.slice(-3)
    prior = clean.slice(-6, -3)
    window = '3v3'
  }

  const recentMed = median(recent)
  const priorMed = median(prior)
  if (priorMed <= 0) {
    return { status: 'insufficient', sessionsWithVolume: clean.length, needed: 6 }
  }

  const diffPct = ((recentMed - priorMed) / priorMed) * 100
  const deltaKg = recentMed - priorMed

  const noiseRel = 4
  const noiseAbsKg = 35
  const strongRel = 7

  let direction: 'up' | 'down' | 'stable'
  if (Math.abs(diffPct) < noiseRel && Math.abs(deltaKg) < noiseAbsKg) {
    direction = 'stable'
  } else if (diffPct > strongRel || (diffPct > noiseRel && deltaKg > noiseAbsKg)) {
    direction = 'up'
  } else if (diffPct < -strongRel || (diffPct < -noiseRel && -deltaKg > noiseAbsKg)) {
    direction = 'down'
  } else {
    direction = 'stable'
  }

  return {
    status: 'ok',
    direction,
    diffPct,
    recentMedian: recentMed,
    priorMedian: priorMed,
    window,
  }
}

export type StrengthProgressInsight =
  | { status: 'insufficient' }
  | {
      status: 'ok'
      exerciseName: string
      deltaPct: number
      fromKg: number
      toKg: number
      sampleDays: number
      recentMilestone?: {
        name: string
        weight_kg: number
        achieved_at: string
      } | null
    }

export type StrengthProgressPoint = { achieved_at: string; weight_kg: number }

/**
 * Compares median load in the first third vs last third of points in the rolling window.
 * Also checks for absolute PRs achieved in the last 7 days to highlight them.
 */
export function computeStrengthProgressInsight(
  entries: Array<{ name: string; points: StrengthProgressPoint[] }>,
  now: Date,
  windowDays = 30,
): StrengthProgressInsight {
  const start = new Date(now)
  start.setDate(start.getDate() - (windowDays - 1))
  start.setHours(0, 0, 0, 0)
  const startMs = start.getTime()

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const sevenDaysAgoMs = sevenDaysAgo.getTime()

  let recentMilestone: { name: string; weight_kg: number; achieved_at: string } | null = null
  let best: {
    name: string
    deltaPct: number
    fromK: number
    toK: number
    n: number
  } | null = null

  for (const ex of entries) {
    const allPts = [...ex.points].sort(
      (a, b) => new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime(),
    )
    if (allPts.length === 0) continue

    // Check for absolute PR in last 7 days (requires a prior mark that was strictly beaten)
    if (allPts.length >= 2) {
      const priorMax = Math.max(...allPts.slice(0, -1).map((p) => p.weight_kg))
      const latestPt = allPts[allPts.length - 1]
      const latestPtMs = new Date(latestPt.achieved_at).getTime()

      if (latestPt.weight_kg > priorMax && latestPtMs >= sevenDaysAgoMs) {
        if (!recentMilestone || latestPt.weight_kg > recentMilestone.weight_kg) {
          recentMilestone = {
            name: ex.name,
            weight_kg: latestPt.weight_kg,
            achieved_at: latestPt.achieved_at,
          }
        }
      }
    }

    const windowPts = allPts.filter((p) => new Date(p.achieved_at).getTime() >= startMs)
    if (windowPts.length < 4) continue

    const n = windowPts.length
    const third = Math.max(1, Math.floor(n / 3))
    const firstSlice = windowPts.slice(0, third)
    const lastSlice = windowPts.slice(-third)
    const medFirst = median(firstSlice.map((p) => p.weight_kg))
    const medLast = median(lastSlice.map((p) => p.weight_kg))
    if (medFirst <= 0) continue

    const deltaPct = ((medLast - medFirst) / medFirst) * 100
    if (deltaPct < 1.25) continue

    if (!best || deltaPct > best.deltaPct) {
      best = { name: ex.name, deltaPct, fromK: medFirst, toK: medLast, n }
    }
  }

  if (!best && !recentMilestone) return { status: 'insufficient' }

  return {
    status: 'ok',
    exerciseName: best?.name || recentMilestone?.name || '',
    deltaPct: best?.deltaPct || 0,
    fromKg: best?.fromK || 0,
    toKg: best?.toK || 0,
    sampleDays: best?.n || 0,
    recentMilestone,
  }
}
