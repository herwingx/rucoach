import { createClient } from '@/lib/supabase/server'

export type SessionExerciseLogRow = {
  workout_session_id: string
  exercise_name: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  is_warmup: boolean | null
  is_pr: boolean | null
  created_at?: string | null
}

export async function getWorkoutSessions(clientId: string, limit = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `
      id, client_id, routine_day_id, started_at, finished_at, duration_minutes,
      total_volume_kg, exercises_completed, exercises_skipped,
      feeling_score, feeling_note, status, created_at,
      routine_days:routine_day_id (day_name, day_number)
    `,
    )
    .eq('client_id', clientId)
    .order('started_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching workout sessions:', error)
    return []
  }

  return data || []
}

/** Sesiones completadas con `started_at` dentro de un rango de fechas. */
export async function getWorkoutSessionsByDateRange(
  clientId: string,
  from: string, // YYYY-MM-DD
  to: string,   // YYYY-MM-DD
  limit = 200,
) {
  const supabase = await createClient()

  // Ensure 'to' covers the end of the day in UTC-6 (Mexico) by extending +6h into the next UTC day.
  const toDate = new Date(`${to.slice(0, 10)}T00:00:00.000Z`)
  toDate.setUTCDate(toDate.getUTCDate() + 1)
  const toNextDayIso = `${toDate.toISOString().split('T')[0]}T06:00:00.000Z`

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `
      id, client_id, routine_day_id, started_at, finished_at, duration_minutes,
      total_volume_kg, exercises_completed, exercises_skipped,
      feeling_score, feeling_note, status, created_at,
      routine_days:routine_day_id (day_name, day_number)
    `,
    )
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .gte('started_at', from)
    .lt('started_at', toNextDayIso)
    .order('started_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching workout sessions by date range:', error)
    return []
  }

  return data || []
}

/** Sesiones con `started_at` dentro del mes local [inicio, siguiente mes). */
export async function getWorkoutSessionsForMonth(
  clientId: string,
  year: number,
  monthIndex: number,
  limit = 200,
) {
  const supabase = await createClient()
  const start = new Date(year, monthIndex, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 1)
  end.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `
      id, client_id, routine_day_id, started_at, finished_at, duration_minutes,
      total_volume_kg, exercises_completed, exercises_skipped,
      feeling_score, feeling_note, status, created_at,
      routine_days:routine_day_id (day_name, day_number)
    `,
    )
    .eq('client_id', clientId)
    .gte('started_at', start.toISOString())
    .lt('started_at', end.toISOString())
    .order('started_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching workout sessions for month:', error)
    return []
  }

  return data || []
}

/** Logs agrupables por sesión (ficha admin). Límite razonable vía cantidad de sesiones en la página. */
export async function getExerciseLogsForSessions(
  sessionIds: string[],
): Promise<SessionExerciseLogRow[]> {
  if (sessionIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercise_logs')
    .select(
      'workout_session_id, exercise_name, set_number, weight_kg, reps, is_warmup, is_pr, created_at',
    )
    .in('workout_session_id', sessionIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching exercise logs for sessions:', error)
    return []
  }

  return (data || []) as SessionExerciseLogRow[]
}

export async function getBodyMeasurements(clientId: string, limit = 200) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('body_measurements')
    .select('id, recorded_at, weight, body_fat_pct, waist_cm')
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching measurements:', error)
    return []
  }

  return data || []
}

export async function getClientStats(clientId: string) {
  const supabase = await createClient()
  
  // Get total sessions
  const { count: totalSessions } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'completed')

  // Get latest measurement
  const { data: latestMeasurement } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  return {
    totalSessions: totalSessions || 0,
    latestMeasurement,
  }
}
