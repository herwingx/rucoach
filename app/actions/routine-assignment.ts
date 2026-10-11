"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import {
  buildWeeklyProgressionSuggestions,
  type WeeklyLogRow,
} from "@/lib/weekly-progression-suggestions";
import {
  getNextRoutineDayIndex,
  sortRoutineDaysByDayNumber,
} from "@/lib/next-routine-day";

export async function restartClientRoutine(clientRoutineId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Only admins can restart routines");
  }

  // Update client_routines current week/day
  const { error: updateError } = await supabase
    .from("client_routines")
    .update({
      current_week: 1,
      current_day_index: 0,
    })
    .eq("id", clientRoutineId);

  if (updateError) throw updateError;

  revalidatePath("/admin/dashboard");
  revalidatePath("/client/dashboard");

  return { success: true };
}

export async function assignRoutineToClient(
  clientId: string,
  routineId: string,
  notes?: string,
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Only admins can assign routines");
  }

  // Verificar que el cliente pertenece al coach
  const { data: clientCheck } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("coach_id", user.id)
    .single();

  if (!clientCheck) {
    throw new Error("No puedes asignar rutinas a clientes que no son tuyos");
  }

  // Desactivar rutinas previas del cliente
  await supabase
    .from("client_routines")
    .update({ is_active: false })
    .eq("client_id", clientId);

  // Asignar rutina en client_routines
  const { data, error } = await supabase
    .from("client_routines")
    .insert({
      client_id: clientId,
      routine_id: routineId,
      assigned_by: user.id,
      notes,
      is_active: true,
    })
    .select();

  if (error) throw error;

  // Sincronizar clients.assigned_routine_id para vistas que lo usan
  await supabase
    .from("clients")
    .update({ assigned_routine_id: routineId })
    .eq("id", clientId);

  // Notificar por email (background) y Push Notification
  try {
    const { data: clientInfo } = await supabase
      .from("clients")
      .select("full_name, email, user_id")
      .eq("id", clientId)
      .single();

    const { data: routineInfo } = await supabase
      .from("routines")
      .select("name")
      .eq("id", routineId)
      .single();

    if (clientInfo && routineInfo?.name) {
      const tasks: Promise<unknown>[] = [];
      if (clientInfo.email) {
        const { sendNewRoutineNotification } = await import("@/lib/email");
        tasks.push(
          sendNewRoutineNotification({
            to: clientInfo.email,
            clientName: clientInfo.full_name,
            routineName: routineInfo.name,
          }).catch((err) => console.error("Error enviando email rutina:", err)),
        );
      }

      if (clientInfo.user_id) {
        const { notifyUser } = await import("@/lib/push");
        tasks.push(
          notifyUser(clientInfo.user_id, {
            title: "🔥 ¡Nueva Rutina Asignada!",
            body: `Tu coach ha subido tu bloque: ${routineInfo.name}. ¡A darle!`,
            url: "/client/routines",
            tag: "routine-assigned",
          }),
        );
      }

      if (tasks.length > 0) {
        await Promise.allSettled(tasks);
      }
    }
  } catch (err) {
    console.warn("No se pudo enviar notificación de rutina:", err);
  }

  revalidatePath("/admin/routines");
  revalidatePath(`/admin/routines/${routineId}`);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/client/routines");
  revalidatePath("/client/dashboard");

  return data[0];
}

export async function getClientRoutines(clientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_routines")
    .select(
      `
      id,
      routine_id,
      current_week,
      current_day_index,
      is_active,
      routines (
        id,
        name,
        duration_weeks,
        days_per_week,
        description
      )
    `,
    )
    .eq("client_id", clientId)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

export async function updateClientRoutineProgress(
  clientRoutineId: string,
  weekNumber: number,
  dayNumber: number,
  workoutSessionId?: string,
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();

  // Update week progress
  const { data, error } = await supabase
    .from("routine_week_progress")
    .upsert({
      client_routine_id: clientRoutineId,
      week_number: weekNumber,
      day_number: dayNumber,
      workout_session_id: workoutSessionId,
      completed_at: new Date(),
    })
    .select();

  if (error) throw error;

  // Update client_routines current week/day
  const { error: updateError } = await supabase
    .from("client_routines")
    .update({
      current_week: weekNumber,
      current_day_index: dayNumber,
    })
    .eq("id", clientRoutineId);

  if (updateError) throw updateError;
  return data[0];
}

export async function getNextWorkoutDay(clientRoutineId: string) {
  const supabase = await createClient();

  const { data: clientRoutine, error: routineError } = await supabase
    .from("client_routines")
    .select(
      `
      id,
      client_id,
      current_week,
      routine_id,
      override_next_day_id,
      routines (
        duration_weeks,
        days_per_week
      )
    `,
    )
    .eq("id", clientRoutineId)
    .single();

  if (routineError) throw routineError;

  const raw = clientRoutine.routines as
    | { duration_weeks: number | null; days_per_week: number }
    | { duration_weeks: number | null; days_per_week: number }[]
    | null;
  const routine = Array.isArray(raw) ? raw[0] : raw;
  if (!routine) throw new Error("Rutina no encontrada para esta asignación");

  const totalWeeks = routine.duration_weeks ?? 0;
  if (totalWeeks > 0 && clientRoutine.current_week > totalWeeks) {
    return {
      isComplete: true,
      message: "¡Felicidades! Rutina completada 🏆",
      suggestedAction: `Has completado las ${totalWeeks} semanas de esta rutina. Hemos notificado a tu coach para que revise tu progreso y te asigne el siguiente reto.`,
    };
  }

  const [
    { data: routineDaysRaw, error: daysError },
    { data: recentSessions },
  ] = await Promise.all([
    supabase
      .from("routine_days")
      .select(
        `
        id,
        day_number,
        day_name,
        focus,
        is_rest_day,
        routine_exercises (
          id,
          exercise_id,
          order_index,
          sets,
          reps,
          rest_seconds,
          superset_group,
          notes,
          exercises (
            id,
            name,
            name_es,
            primary_muscle,
            secondary_muscle,
            secondary_muscles,
            secondary_muscles_es,
            body_parts,
            body_parts_es,
            equipment,
            equipment_es,
            exercise_type,
            uses_external_load,
            gif_url,
            image_url,
            demo_video_url,
            instructions,
            instructions_es,
            target_muscles,
            target_muscles_es,
            technique_notes
          )
        )
      `,
      )
      .eq("routine_id", clientRoutine.routine_id),
    supabase
      .from("workout_sessions")
      .select("routine_day_id")
      .eq("client_id", clientRoutine.client_id)
      .eq("status", "completed")
      .not("routine_day_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (daysError) throw daysError;

  const sortedDays = sortRoutineDaysByDayNumber(routineDaysRaw ?? []).map(
    (d) => ({
      ...d,
      routine_exercises: [...(d.routine_exercises ?? [])].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
      ),
    }),
  );
  if (!sortedDays.length) {
    return {
      isComplete: false,
      week: clientRoutine.current_week,
      day: 0,
      isRestDay: true,
      message: "No hay días configurados en esta rutina.",
    };
  }

  const planDayIdSet = new Set(sortedDays.map((d) => d.id));

  let lastRoutineDayId: string | null = null;
  for (const row of recentSessions ?? []) {
    const rid = row.routine_day_id as string | null;
    if (rid && planDayIdSet.has(rid)) {
      lastRoutineDayId = rid;
      break;
    }
  }

  const overrideDayId = (
    clientRoutine as { override_next_day_id?: string | null }
  ).override_next_day_id;
  const overrideIdx = overrideDayId
    ? sortedDays.findIndex(
        (d) =>
          d.id === overrideDayId &&
          !d.is_rest_day &&
          Array.isArray(d.routine_exercises) &&
          d.routine_exercises.length > 0,
      )
    : -1;

  const computedIdx = getNextRoutineDayIndex(sortedDays, lastRoutineDayId);
  const nextIdx = overrideIdx >= 0 ? overrideIdx : computedIdx;
  const routineDay = nextIdx === null ? null : sortedDays[nextIdx];

  if (!routineDay) {
    return {
      isComplete: false,
      week: clientRoutine.current_week,
      day: 0,
      isRestDay: true,
      message: "Día de descanso. Recuperate bien.",
    };
  }

  let exercisesWithOverrides = routineDay.routine_exercises || [];
  if (exercisesWithOverrides.length > 0) {
    const { applyExerciseOverrides } = await import(
      "@/app/actions/routine-overrides"
    );
    exercisesWithOverrides = await applyExerciseOverrides(
      clientRoutine.id,
      exercisesWithOverrides,
      supabase,
    );
  }

  const blockLabel = routineDay.day_name
    ? `Día ${routineDay.day_number} · ${routineDay.day_name}`
    : `Día ${routineDay.day_number}`;

  return {
    isComplete: false,
    week: clientRoutine.current_week,
    day: nextIdx,
    dayName: routineDay.day_name,
    dayFocus: (routineDay as { focus?: string | null }).focus ?? null,
    isRestDay: routineDay.is_rest_day,
    exercises: exercisesWithOverrides,
    message: `Próximo bloque: ${blockLabel}`,
  };
}

export async function suggestProgressionWeekly(clientRoutineId: string) {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();

  const { data: clientRoutine, error: crErr } = await supabase
    .from("client_routines")
    .select("client_id")
    .eq("id", clientRoutineId)
    .single();

  if (crErr || !clientRoutine?.client_id) return [];

  const { data: clientRow } = await supabase
    .from("clients")
    .select("user_id")
    .eq("id", clientRoutine.client_id)
    .single();

  if (clientRow?.user_id !== user.id) return [];

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("client_id", clientRoutine.client_id)
    .gte("started_at", weekAgo);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return [];

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select(
      `exercise_id, weight_kg, reps, is_warmup, created_at, workout_session_id, exercises(name, exercise_type, uses_external_load, equipment)`,
    )
    .in("workout_session_id", sessionIds)
    .order("created_at", { ascending: true });

  return buildWeeklyProgressionSuggestions((logs ?? []) as WeeklyLogRow[]);
}
