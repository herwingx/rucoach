// RU Coach Premium - TypeScript Types

export type UserRole = 'admin' | 'client' | 'receptionist'
export type FitnessGoal = 'lose_weight' | 'gain_muscle' | 'maintain' | 'strength' | 'endurance'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  avatar_url?: string
  username?: string
  xp_points: number
  level: number
  streak_days: number
  last_workout_at?: string
  fitness_goal?: FitnessGoal
  experience_level?: ExperienceLevel
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id?: string
  coach_id?: string
  email: string
  full_name: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  avatar_url?: string
  goal?: string
  experience_level?: string
  current_plan_id?: string
  status: string
  notes?: string
  initial_weight?: number
  current_weight?: number
  height?: number
  membership_start?: string
  membership_end?: string
  total_sessions: number
  last_session_at?: string
  assigned_routine_id?: string
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  name: string
  primary_muscle?: string
  secondary_muscle?: string
  exercise_type?: string
  uses_external_load?: boolean
  equipment?: string
  demo_video_url?: string
  technique_notes?: string
  image_url?: string
  gif_url?: string
  target_muscles?: string[]
  body_parts?: string[]
  body_part?: string | null
  equipments?: string[]
  secondary_muscles?: string[]
  instructions?: string[]
  // -- Columnas en español --
  name_es?: string
  equipment_es?: string
  body_parts_es?: string[]
  target_muscles_es?: string[]
  secondary_muscles_es?: string[]
  instructions_es?: string[]
  // -- Columnas de enriquecimiento anatómico y biomecánico (openGym) --
  muscle_weights?: Record<string, number> | null
  description?: string | null
  description_es?: string | null
  default_increment_kg?: number | null
  created_at: string
  updated_at: string
}

export interface Routine {
  id: string
  name: string
  description?: string | null
  goal?: string | null
  level?: string | null
  days_per_week?: number
  duration_weeks?: number | null
  created_at: string
  updated_at: string
  routine_days?: RoutineDay[]
}

export interface RoutineDay {
  id: string
  routine_id: string
  day_number: number
  day_name?: string
  focus?: string
  is_rest_day?: boolean
  created_at: string
  routine_exercises?: RoutineExercise[]
}

export interface RoutineExercise {
  id: number
  routine_day_id: string
  exercise_id: string
  order_index: number
  sets: number
  reps?: string
  rpe?: number | string | null
  suggested_weight?: number
  duration_seconds?: number
  rest_seconds?: number
  superset_group?: string | null
  notes?: string | null
  warmup_sets?: string | null
  progression_policy?: 'off' | 'linear' | 'double' | 'triple' | 'greyskull' | 'time' | null
  reps_min?: number | null
  reps_max?: number | null
  intensifier?: {
    type: 'dropset' | 'restpause' | 'pyramid' | 'failure'
    drops?: number
    drop_pct?: number
    clusters?: number
    cluster_reps?: number
    cluster_rest_seconds?: number
  } | null
  created_at: string
  exercises?: Exercise
}

export interface WorkoutSession {
  id: string
  client_id: string
  routine_day_id?: string
  status: string
  started_at?: string
  finished_at?: string
  duration_minutes?: number
  exercises_completed: number
  exercises_skipped: number
  total_volume_kg?: number
  feeling_score?: number
  feeling_note?: string
  created_at: string
}

export interface ExerciseLog {
  id: string
  workout_session_id: string
  exercise_id: string
  set_number: number
  weight_kg?: number // DB name: weight
  reps?: number
  rpe?: number
  is_warmup: boolean
  is_pr: boolean
  notes?: string
  created_at: string
  exercises?: Exercise
}

export interface PersonalRecord {
  id: string
  client_id: string // DB name: user_id
  exercise_id: string
  weight_kg: number // DB name: max_weight
  reps: number // DB name: max_reps
  estimated_1rm?: number
  achieved_at: string // DB name: last_updated
  exercises?: Exercise
}

export interface Achievement {
  id: string
  name: string
  description?: string
  icon: string // DB name: icon_emoji
  xp_reward: number
  category: 'strength' | 'consistency' | 'volume' | 'milestone' | 'special'
  requirement_type:
    | 'sessions'
    | 'streak'
    | 'pr'
    | 'volume'
    | 'level'
    | 'messages'
    | 'early_workouts'
    | 'measurement_months'
    | 'lifetime_volume'
    | 'lift_bench_bw'
    | 'lift_squat_bw15'
    | 'lift_deadlift_bw2'
  requirement_value: number
  created_at: string
  /** Optional: DB column when present; UI defaults to common */
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievements?: Achievement
}

export interface MembershipPlan {
  id: string
  name: string
  description?: string
  price: number
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  client_id: string
  plan_id?: string
  amount: number
  payment_method?: string
  paid_at?: string
  period_start?: string
  period_end?: string
  reference?: string
  created_at: string
  clients?: Client
  membership_plans?: MembershipPlan
}

export interface BodyMeasurement {
  id: string
  client_id: string
  recorded_at: string
  weight?: number
  body_fat_pct?: number
  waist_cm?: number
  hip_cm?: number
  chest_cm?: number
  arm_cm?: number
  thigh_cm?: number
  created_at: string
}

// Gamification helpers
export interface LevelInfo {
  level: number
  currentXP: number
  xpForNextLevel: number
  progress: number
}

export function calculateLevel(xp: number): LevelInfo {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100
  const xpForNextLevel = Math.pow(level, 2) * 100
  const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
  
  return {
    level,
    currentXP: xp,
    xpForNextLevel,
    progress: Math.min(progress, 100)
  }
}

/** Etapas de progreso enfocadas en hábito y entrenamiento (no “rangos” de videojuego). */
export function getLevelName(level: number): string {
  if (level < 5) return 'Iniciante'
  if (level < 10) return 'En construcción'
  if (level < 15) return 'Constante'
  if (level < 20) return 'Comprometido'
  if (level < 30) return 'Avanzado'
  if (level < 40) return 'Experimentado'
  if (level < 50) return 'Alto rendimiento'
  return 'Referente'
}

export function calculate1RM(weight: number, reps: number): number {
  // Epley formula
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}
