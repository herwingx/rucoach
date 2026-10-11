import { createClient } from '@/lib/supabase/server'
import { getAchievementsEarlyWorkoutTimezone } from '@/lib/constants'
import { longestConsecutiveMonthStreak } from '@/lib/achievement-month-streak'
import { liftBenchmarkKind } from '@/lib/achievement-rules'
import {
  normalizeAchievementList,
  normalizeRequirementValue,
  normalizeUserAchievementsRows,
} from '@/lib/achievements-normalize'
import { exerciseUsesExternalLoad } from '@/lib/exercise-tracking'
import { calculateLevel, calculate1RM } from './types'
import type { Achievement, UserAchievement, LevelInfo } from './types'

// XP rewards
export const XP_REWARDS = {
  COMPLETE_WORKOUT: 100,
  STREAK_DAY: 50,
  NEW_PR: 200,
  FIRST_WORKOUT: 150,
} as const

export type ClientAchievementMetrics = {
  totalSessions: number
  streakDays: number
  level: number
  prCount: number
  maxVolumeKg: number
  messagesSent: number
  earlyWorkouts: number
  measurementMonthStreak: number
  lifetimeVolumeKg: number
  bodyWeightKg: number
  benchBwPercent: number
  squatBwPercent: number
  deadliftBwPercent: number
}

type SessionRollups = {
  lifetime_volume_kg: number
  early_workout_count: number
  max_session_volume_kg: number
}

/** Count completed sessions from DB (source of truth for gamification). */
async function countCompletedWorkoutSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
): Promise<number | null> {
  const { count, error } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'completed')

  if (error) {
    console.warn('[gamification] countCompletedWorkoutSessions', error.message)
    return null
  }
  return count ?? 0
}

/** Prefer live count so achievements stay in sync if denormalized total_sessions lags. */
export async function resolveClientTotalSessions(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, total_sessions')
    .eq('user_id', userId)
    .maybeSingle()

  let totalSessions = client?.total_sessions ?? 0
  if (client?.id) {
    const counted = await countCompletedWorkoutSessions(supabase, client.id)
    if (counted !== null) {
      totalSessions = Math.max(totalSessions, counted)
    }
  }
  return totalSessions
}

function monthKeyInTz(iso: string, timeZone: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value ?? '0'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  return `${y}-${m}`
}

function parseSessionRollups(raw: unknown): SessionRollups {
  if (!raw || typeof raw !== 'object') {
    return { lifetime_volume_kg: 0, early_workout_count: 0, max_session_volume_kg: 0 }
  }
  const o = raw as Record<string, unknown>
  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? '0'))
    return Number.isFinite(n) ? n : 0
  }
  return {
    lifetime_volume_kg: num(o.lifetime_volume_kg),
    early_workout_count: num(o.early_workout_count),
    max_session_volume_kg: num(o.max_session_volume_kg),
  }
}

async function fetchClientAchievementMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string | undefined,
  userId: string,
): Promise<Omit<ClientAchievementMetrics, 'totalSessions' | 'streakDays' | 'level'>> {
  const empty: Omit<ClientAchievementMetrics, 'totalSessions' | 'streakDays' | 'level'> = {
    prCount: 0,
    maxVolumeKg: 0,
    messagesSent: 0,
    earlyWorkouts: 0,
    measurementMonthStreak: 0,
    lifetimeVolumeKg: 0,
    bodyWeightKg: 0,
    benchBwPercent: 0,
    squatBwPercent: 0,
    deadliftBwPercent: 0,
  }
  if (!clientId) return empty

  const tz = getAchievementsEarlyWorkoutTimezone()

  const [prRows, msgHead, rollupsRes, measurements, clientRow] = await Promise.all([
    supabase
      .from('personal_records')
      .select(
        'exercise_id, exercise_name, estimated_1rm, exercises(name, exercise_type, uses_external_load, equipment)',
      )
      .eq('client_id', clientId),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', userId),
    supabase.rpc('client_achievement_session_rollups', {
      p_client_id: clientId,
      p_tz: tz,
    }),
    supabase.from('body_measurements').select('recorded_at').eq('client_id', clientId),
    supabase.from('clients').select('current_weight, initial_weight').eq('id', clientId).maybeSingle(),
  ])

  const rollups = parseSessionRollups(rollupsRes.data)

  // Si la RPC no existe aún (migración pendiente), fallback sin romper el build
  let lifetimeVolumeKg = rollups.lifetime_volume_kg
  let earlyWorkouts = rollups.early_workout_count
  let maxVolumeKg = rollups.max_session_volume_kg

  if (rollupsRes.error) {
    console.warn(
      '[gamification] client_achievement_session_rollups:',
      rollupsRes.error.message,
    )
    const [volTop, volSum, sessionsStarted] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('total_volume_kg')
        .eq('client_id', clientId)
        .order('total_volume_kg', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('workout_sessions').select('total_volume_kg').eq('client_id', clientId),
      supabase.from('workout_sessions').select('started_at').eq('client_id', clientId).not('started_at', 'is', null),
    ])
    maxVolumeKg = Number(volTop.data?.total_volume_kg ?? 0)
    lifetimeVolumeKg =
      volSum.data?.reduce((sum, r) => sum + Number(r.total_volume_kg ?? 0), 0) ?? 0
    earlyWorkouts = 0
    for (const row of sessionsStarted.data ?? []) {
      const iso = row.started_at
      if (!iso) continue
      const h = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hourCycle: 'h23',
        timeZone: tz,
      }).format(new Date(iso))
      if (Number.parseInt(h, 10) < 8) earlyWorkouts++
    }
  }

  const loadAwarePrRows = (prRows.data ?? []).filter((row) => {
    const ex =
      row.exercises && !Array.isArray(row.exercises)
        ? (row.exercises as {
            exercise_type?: string | null
            uses_external_load?: boolean | null
            equipment?: string | null
          })
        : null
    return exerciseUsesExternalLoad(ex?.exercise_type, ex?.uses_external_load, ex?.equipment)
  })

  const prCount = loadAwarePrRows.length
  const messagesSent = msgHead.count ?? 0

  const monthKeys = (measurements.data ?? [])
    .map((m) => m.recorded_at && monthKeyInTz(m.recorded_at, tz))
    .filter(Boolean) as string[]
  const measurementMonthStreak = longestConsecutiveMonthStreak(monthKeys)

  let bodyWeightKg = Number(clientRow.data?.current_weight ?? clientRow.data?.initial_weight ?? 0)
  if (!bodyWeightKg || bodyWeightKg <= 0) {
    const { data: lastM } = await supabase
      .from('body_measurements')
      .select('weight')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    bodyWeightKg = Number(lastM?.weight ?? 0)
  }

  let maxBench = 0
  let maxSquat = 0
  let maxDl = 0
  for (const row of loadAwarePrRows) {
    const ex = row.exercises as { name?: string } | null
    const joinedName = ex && typeof ex === 'object' && !Array.isArray(ex) ? ex.name : undefined
    const name =
      (typeof row.exercise_name === 'string' && row.exercise_name.trim() !== ''
        ? row.exercise_name
        : joinedName) ?? ''
    const e1 = Number(row.estimated_1rm ?? 0)
    if (!e1 || !row.exercise_id) continue
    const kind = liftBenchmarkKind(String(row.exercise_id), name)
    if (kind === 'bench') maxBench = Math.max(maxBench, e1)
    else if (kind === 'squat') maxSquat = Math.max(maxSquat, e1)
    else if (kind === 'deadlift') maxDl = Math.max(maxDl, e1)
  }

  const bw = bodyWeightKg > 0 ? bodyWeightKg : 0
  const ratio = (v: number) => (bw > 0 ? (v / bw) * 100 : 0)

  return {
    prCount,
    maxVolumeKg,
    messagesSent,
    earlyWorkouts,
    measurementMonthStreak,
    lifetimeVolumeKg,
    bodyWeightKg: bw,
    benchBwPercent: ratio(maxBench),
    squatBwPercent: ratio(maxSquat),
    deadliftBwPercent: ratio(maxDl),
  }
}

function achievementRequirementTarget(achievement: Achievement): number {
  return normalizeRequirementValue(achievement.requirement_value)
}

function achievementQualified(achievement: Achievement, m: ClientAchievementMetrics): boolean {
  const v = achievementRequirementTarget(achievement)
  switch (achievement.requirement_type) {
    case 'sessions':
      return m.totalSessions >= v
    case 'streak':
      return m.streakDays >= v
    case 'level':
      return m.level >= v
    case 'pr':
      return m.prCount >= v
    case 'volume':
      return m.maxVolumeKg >= v
    case 'messages':
      return m.messagesSent >= v
    case 'early_workouts':
      return m.earlyWorkouts >= v
    case 'measurement_months':
      return m.measurementMonthStreak >= v
    case 'lifetime_volume':
      return m.lifetimeVolumeKg >= v
    case 'lift_bench_bw':
      return m.bodyWeightKg > 0 && m.benchBwPercent >= v
    case 'lift_squat_bw15':
      return m.bodyWeightKg > 0 && m.squatBwPercent >= v
    case 'lift_deadlift_bw2':
      return m.bodyWeightKg > 0 && m.deadliftBwPercent >= v
    default:
      return false
  }
}

function progressValueForAchievement(achievement: Achievement, m: ClientAchievementMetrics): number {
  const v = achievementRequirementTarget(achievement)
  switch (achievement.requirement_type) {
    case 'sessions':
      return m.totalSessions
    case 'streak':
      return m.streakDays
    case 'level':
      return m.level
    case 'pr':
      return m.prCount
    case 'volume':
      return m.maxVolumeKg
    case 'messages':
      return m.messagesSent
    case 'early_workouts':
      return m.earlyWorkouts
    case 'measurement_months':
      return m.measurementMonthStreak
    case 'lifetime_volume':
      return m.lifetimeVolumeKg
    case 'lift_bench_bw':
      return Math.min(Math.floor(m.benchBwPercent), v)
    case 'lift_squat_bw15':
      return Math.min(Math.floor(m.squatBwPercent), v)
    case 'lift_deadlift_bw2':
      return Math.min(Math.floor(m.deadliftBwPercent), v)
    default:
      return 0
  }
}

// Get user's current level info
export async function getUserLevelInfo(userId: string): Promise<LevelInfo> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('xp_points')
    .eq('id', userId)
    .single()

  return calculateLevel(data?.xp_points || 0)
}

// Award XP to user
export async function awardXP(
  userId: string,
  amount: number,
): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_points')
    .eq('id', userId)
    .single()

  const currentXP = profile?.xp_points || 0
  const currentLevel = calculateLevel(currentXP).level
  const newXP = currentXP + amount
  const newLevelInfo = calculateLevel(newXP)
  const leveledUp = newLevelInfo.level > currentLevel

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      xp_points: newXP,
      level: newLevelInfo.level,
    })
    .eq('id', userId)

  if (profileUpdateError) {
    console.error('[awardXP] profile update', profileUpdateError)
  }

  return {
    newXP,
    leveledUp,
    newLevel: newLevelInfo.level,
  }
}

function datePartsInTz(
  d: Date,
  timeZone: string,
): { y: number; m: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = Number(parts.find((p) => p.type === 'year')?.value ?? 1970)
  const m = Number(parts.find((p) => p.type === 'month')?.value ?? 1)
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? 1)
  return { y, m, day }
}

function calendarDaysBetweenInTz(
  earlier: Date,
  later: Date,
  timeZone = 'America/Mexico_City',
): number {
  const a = datePartsInTz(earlier, timeZone)
  const b = datePartsInTz(later, timeZone)
  const utcA = Date.UTC(a.y, a.m - 1, a.day)
  const utcB = Date.UTC(b.y, b.m - 1, b.day)
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24))
}

// Update streak
export async function updateStreak(userId: string): Promise<{ streakDays: number; streakBroken: boolean }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_days, last_workout_at')
    .eq('id', userId)
    .single()

  const now = new Date()
  const lastWorkout = profile?.last_workout_at ? new Date(profile.last_workout_at) : null
  const currentStreak = profile?.streak_days || 0

  let newStreak = 1
  let streakBroken = false

  if (lastWorkout && !Number.isNaN(lastWorkout.getTime())) {
    const daysSinceLastWorkout = calendarDaysBetweenInTz(
      lastWorkout,
      now,
      'America/Mexico_City',
    )

    if (daysSinceLastWorkout <= 0) {
      newStreak = Math.max(1, currentStreak)
    } else if (daysSinceLastWorkout === 1) {
      newStreak = currentStreak + 1
    } else {
      newStreak = 1
      streakBroken = currentStreak > 0
    }
  }

  await supabase
    .from('profiles')
    .update({
      streak_days: newStreak,
      last_workout_at: now.toISOString(),
    })
    .eq('id', userId)

  return { streakDays: newStreak, streakBroken }
}

async function buildAchievementMetrics(userId: string): Promise<ClientAchievementMetrics> {
  const supabase = await createClient()

  const [{ data: profile }, { data: client }] = await Promise.all([
    supabase.from('profiles').select('streak_days, xp_points').eq('id', userId).single(),
    supabase.from('clients').select('id, total_sessions').eq('user_id', userId).single(),
  ])

  let totalSessions = client?.total_sessions ?? 0
  if (client?.id) {
    const counted = await countCompletedWorkoutSessions(supabase, client.id)
    if (counted !== null) {
      totalSessions = Math.max(totalSessions, counted)
    }
  }

  const extended = await fetchClientAchievementMetrics(supabase, client?.id, userId)

  return {
    totalSessions,
    streakDays: profile?.streak_days ?? 0,
    level: calculateLevel(profile?.xp_points ?? 0).level,
    ...extended,
  }
}

// Check and unlock achievements
export async function checkAchievements(userId: string): Promise<Achievement[]> {
  const supabase = await createClient()

  const [
    { data: profile },
    { data: client },
    { data: rawAchievements },
    { data: unlockedAchievements },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('streak_days, xp_points')
      .eq('id', userId)
      .single(),
    supabase
      .from('clients')
      .select('id, total_sessions')
      .eq('user_id', userId)
      .single(),
    supabase.from('achievements').select('*'),
    supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId),
  ])

  const unlockedIds = new Set(unlockedAchievements?.map((ua) => ua.achievement_id) || [])
  const newlyUnlocked: Achievement[] = []

  const allAchievements = normalizeAchievementList(rawAchievements)

  let totalSessions = client?.total_sessions ?? 0
  if (client?.id) {
    const counted = await countCompletedWorkoutSessions(supabase, client.id)
    if (counted !== null) {
      totalSessions = Math.max(totalSessions, counted)
    }
  }

  const extra = await fetchClientAchievementMetrics(supabase, client?.id, userId)
  const metrics: ClientAchievementMetrics = {
    totalSessions,
    streakDays: profile?.streak_days ?? 0,
    level: calculateLevel(profile?.xp_points ?? 0).level,
    ...extra,
  }

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue

    if (!achievementQualified(achievement, metrics)) continue

    const { error: insertError } = await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievement.id })

    if (insertError) {
      if (insertError.code === '23505') continue
      console.error('[checkAchievements] insert user_achievement', insertError)
      continue
    }

    await awardXP(userId, achievement.xp_reward)
    newlyUnlocked.push(achievement)
  }

  return newlyUnlocked
}

// Get user achievements
export async function getUserAchievements(userId: string): Promise<{
  unlocked: UserAchievement[]
  locked: Achievement[]
  progress: Map<string, number>
}> {
  const supabase = await createClient()

  try {
    await checkAchievements(userId)
  } catch (err) {
    console.warn('[getUserAchievements] checkAchievements failed:', err)
  }

  const [{ data: rawAll }, { data: rawUserRows }, metrics] = await Promise.all([
    supabase.from('achievements').select('*').order('xp_reward', { ascending: true }),
    supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId),
    buildAchievementMetrics(userId),
  ])

  const allAchievements = normalizeAchievementList(rawAll)
  const userAchievements = normalizeUserAchievementsRows(rawUserRows as UserAchievement[] | null)

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id))
  const progress = new Map<string, number>()

  for (const achievement of allAchievements) {
    const target = achievementRequirementTarget(achievement)
    if (unlockedIds.has(achievement.id)) {
      progress.set(achievement.id, target)
    } else {
      progress.set(achievement.id, progressValueForAchievement(achievement, metrics))
    }
  }

  return {
    unlocked: userAchievements,
    locked: allAchievements.filter((a) => !unlockedIds.has(a.id)),
    progress,
  }
}

// Check for new PR
export async function checkAndRecordPR(
  clientId: string,
  exerciseId: string,
  weightKg: number,
  reps: number,
  exerciseName?: string | null,
): Promise<{ isPR: boolean; estimated1RM: number }> {
  const supabase = await createClient()
  const estimated1RM = calculate1RM(weightKg, reps)

  const { data: currentPR } = await supabase
    .from('personal_records')
    .select('estimated_1rm')
    .eq('client_id', clientId)
    .eq('exercise_id', exerciseId)
    .single()

  const isPR = !currentPR || estimated1RM > (currentPR.estimated_1rm || 0)

  if (isPR) {
    const row: Record<string, unknown> = {
      client_id: clientId,
      exercise_id: exerciseId,
      weight_kg: weightKg,
      reps: reps,
      estimated_1rm: estimated1RM,
      achieved_at: new Date().toISOString(),
    }
    row.exercise_name = exerciseName != null && exerciseName !== '' ? exerciseName : ''
    await supabase.from('personal_records').upsert(row, {
      onConflict: 'client_id,exercise_id',
    })
  }

  return { isPR, estimated1RM }
}
