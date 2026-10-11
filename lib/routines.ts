import { createClient } from '@/lib/supabase/server'

// Routines
export async function getRoutines() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching routines:', error)
    return []
  }

  return data || []
}

export async function getRoutineById(routineId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_days (
        *,
        routine_exercises (
          *,
          exercises:exercise_id (*)
        )
      )
    `)
    .eq('id', routineId)
    .single()

  if (error) {
    console.error('Error fetching routine:', error)
    return null
  }

  return data
}

// Exercises
export async function getExercises() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }

  return data || []
}

export async function getExercisesByMuscle(primaryMuscle: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('primary_muscle', primaryMuscle)
    .order('name')

  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }

  return data || []
}

export const muscleGroups = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Abdominales',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Pantorrillas',
]
