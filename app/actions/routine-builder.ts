"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getUserProfile } from "@/lib/auth-utils";

export async function getRoutineMeta(routineId: string): Promise<{
  goal: string | null;
  level: string | null;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .select("goal, level")
    .eq("id", routineId)
    .maybeSingle();
  return data ? { goal: data.goal ?? null, level: data.level ?? null } : null;
}

export async function saveRoutineFromBuilder(data: {
  name: string;
  description: string | null;
  duration_weeks: number;
  goal?: string | null;
  level?: string | null;
  days: {
    day_number: number;
    day_name: string;
    is_rest_day: boolean;
    exercises: {
      exercise_id: string;
      order_index: number;
      sets: number;
      reps: string;
      rest_seconds: number;
      superset_group: string | null;
    }[];
  }[];
}): Promise<string> {
  const user = await getAuthUser();
  const profile = await getUserProfile();

  if (!user || profile?.role !== "admin") {
    throw new Error("No autorizado");
  }

  const supabase = await createClient();
  const routineId = crypto.randomUUID();

  const { error: routineError } = await supabase.from("routines").insert({
    id: routineId,
    coach_id: user.id,
    name: data.name,
    description: data.description,
    duration_weeks: data.duration_weeks,
    goal: data.goal || null,
    level: data.level || null,
    days_per_week: data.days.length,
  });

  if (routineError) throw new Error(routineError.message);

  for (const day of data.days) {
    const dayId = crypto.randomUUID();
    const { error: dayError } = await supabase.from("routine_days").insert({
      id: dayId,
      routine_id: routineId,
      day_number: day.day_number,
      day_name: day.day_name,
      is_rest_day: day.is_rest_day,
    });

    if (dayError) throw new Error(dayError.message);

    if (day.exercises.length > 0) {
      const exercisesPayload = day.exercises.map((ex) => ({
        routine_day_id: dayId,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        superset_group: ex.superset_group ?? null,
      }));
      const { error: reError } = await supabase
        .from("routine_exercises")
        .insert(exercisesPayload);
      if (reError) throw new Error(reError.message);
    }
  }

  return routineId;
}

export async function updateRoutineFromBuilder(
  routineId: string,
  data: {
    name: string;
    description: string | null;
    duration_weeks: number;
    goal?: string | null;
    level?: string | null;
    days: {
      day_number: number;
      day_name: string;
      is_rest_day: boolean;
      exercises: {
        exercise_id: string;
        order_index: number;
        sets: number;
        reps: string;
        rest_seconds: number;
        superset_group: string | null;
      }[];
    }[];
  },
): Promise<void> {
  const user = await getAuthUser();
  const profile = await getUserProfile();

  if (!user || profile?.role !== "admin") {
    throw new Error("No autorizado");
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("routines")
    .select("id, coach_id")
    .eq("id", routineId)
    .single();

  if (!existing || existing.coach_id !== user.id) {
    throw new Error("No autorizado para editar esta rutina");
  }

  const { error: routineError } = await supabase
    .from("routines")
    .update({
      name: data.name,
      description: data.description,
      duration_weeks: data.duration_weeks,
      goal: data.goal || null,
      level: data.level || null,
      days_per_week: data.days.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routineId);

  if (routineError) throw new Error(routineError.message);

  const { error: deleteDaysError } = await supabase
    .from("routine_days")
    .delete()
    .eq("routine_id", routineId);

  if (deleteDaysError) throw new Error(deleteDaysError.message);

  for (const day of data.days) {
    const dayId = crypto.randomUUID();
    const { error: dayError } = await supabase.from("routine_days").insert({
      id: dayId,
      routine_id: routineId,
      day_number: day.day_number,
      day_name: day.day_name,
      is_rest_day: day.is_rest_day,
    });

    if (dayError) throw new Error(dayError.message);

    if (day.exercises.length > 0) {
      const exercisesPayload = day.exercises.map((ex) => ({
        routine_day_id: dayId,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        superset_group: ex.superset_group ?? null,
      }));
      const { error: reError } = await supabase
        .from("routine_exercises")
        .insert(exercisesPayload);
      if (reError) throw new Error(reError.message);
    }
  }
}

export async function deleteRoutine(
  routineId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser();
  const profile = await getUserProfile();

  if (!user || profile?.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("routines")
    .select("id, coach_id")
    .eq("id", routineId)
    .single();

  if (!existing || existing.coach_id !== user.id) {
    return { success: false, error: "No autorizado para eliminar esta rutina" };
  }

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error:
          "No se puede eliminar: la rutina está asignada a clientes o tiene sesiones registradas.",
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}
