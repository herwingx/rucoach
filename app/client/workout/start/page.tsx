import { getAuthUser, getCurrentClientRecord } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getNextRoutineDayIndex,
  isTrainableRoutineDay,
  sortRoutineDaysByDayNumber,
} from "@/lib/next-routine-day";
import type { RoutineDay, RoutineExercise } from "@/lib/types";
import { WorkoutActiveSession } from "./workout-active-session";

export default async function WorkoutStartPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [supabase, client] = await Promise.all([
    createClient(),
    getCurrentClientRecord(user.id),
  ]);

  if (!client) redirect("/client/dashboard");

  // Obtener routine_id: de clients.assigned_routine_id o de client_routines activa
  let routineId = client.assigned_routine_id;
  if (!routineId) {
    const { data: activeRoutine } = await supabase
      .from("client_routines")
      .select("routine_id")
      .eq("client_id", client.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    routineId = activeRoutine?.routine_id ?? null;
  }

  if (!routineId) redirect("/client/dashboard");

  // Wave 1: Obtener rutina completa, vínculo activo, última sesión y récords personales en paralelo
  const [
    { data: routine },
    { data: activeLink },
    { data: lastSession },
    { data: personalRecords },
  ] = await Promise.all([
    supabase
      .from("routines")
      .select(
        `
        *,
        routine_days (
          *,
          routine_exercises (
            *,
            exercises (*)
          )
        )
      `,
      )
      .eq("id", routineId)
      .single(),
    supabase
      .from("client_routines")
      .select("id, current_week, override_next_day_id")
      .eq("client_id", client.id)
      .eq("routine_id", routineId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, routine_day_id")
      .eq("client_id", client.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("personal_records")
      .select("*")
      .eq("client_id", client.id),
  ]);

  if (!routine) {
    redirect("/client/dashboard");
  }

  if (
    activeLink &&
    routine.duration_weeks &&
    activeLink.current_week > routine.duration_weeks
  ) {
    redirect("/client/dashboard");
  }

  const routineDays = sortRoutineDaysByDayNumber(routine.routine_days || []);

  const overrideDayId = (activeLink as { override_next_day_id?: string | null } | null)
    ?.override_next_day_id;
  const overrideDayMatch = overrideDayId
    ? routineDays.find((d) => d.id === overrideDayId && isTrainableRoutineDay(d))
    : undefined;

  const currentDayIndex = getNextRoutineDayIndex(
    routineDays,
    lastSession?.routine_day_id,
  );
  const currentDayRaw =
    overrideDayMatch ??
    (currentDayIndex !== null ? routineDays[currentDayIndex] : undefined);
  if (!currentDayRaw) {
    redirect("/client/dashboard");
  }
  const currentDay = currentDayRaw as RoutineDay & {
    routine_exercises: (RoutineExercise & { exercises: unknown })[];
  };

  currentDay.routine_exercises = [...(currentDay.routine_exercises || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );

  if (activeLink?.id && currentDay.routine_exercises?.length) {
    const { applyExerciseOverrides } = await import(
      "@/app/actions/routine-overrides"
    );
    currentDay.routine_exercises = await applyExerciseOverrides(
      activeLink.id,
      currentDay.routine_exercises,
      supabase,
    );
  }

  /** Última serie de cada ejercicio en la última sesión en que realizó ese ejercicio (previa en UI + sugerencia de peso). */
  const previousByExercise: Record<
    string,
    { weight_kg: number; reps: number }
  > = {};

  const targetExerciseIds = [
    ...new Set(
      (currentDay.routine_exercises || [])
        .map((re) => re.exercise_id)
        .filter(Boolean),
    ),
  ];

  if (targetExerciseIds.length > 0) {
    const { data: rawLogs } = await supabase
      .from("exercise_logs")
      .select(
        "exercise_id, weight_kg, reps, set_number, workout_session_id, created_at, workout_sessions!inner(client_id, status)",
      )
      .eq("workout_sessions.client_id", client.id)
      .eq("workout_sessions.status", "completed")
      .in("exercise_id", targetExerciseIds)
      .order("created_at", { ascending: false })
      .limit(200);

    const latestSessionByExercise = new Map<string, string>();
    const best = new Map<
      string,
      { weight_kg: number; reps: number; set_number: number }
    >();

    for (const row of rawLogs || []) {
      const eid = row.exercise_id as string;
      const sid = row.workout_session_id as string;
      if (!eid || !sid) continue;

      if (!latestSessionByExercise.has(eid)) {
        latestSessionByExercise.set(eid, sid);
      }
      if (latestSessionByExercise.get(eid) !== sid) {
        continue;
      }

      const sn = Number(row.set_number ?? 0);
      const cur = best.get(eid);
      if (!cur || sn >= cur.set_number) {
        best.set(eid, {
          weight_kg: Number(row.weight_kg ?? 0),
          reps: Number(row.reps ?? 0),
          set_number: sn,
        });
      }
    }
    for (const [eid, v] of best) {
      previousByExercise[eid] = { weight_kg: v.weight_kg, reps: v.reps };
    }
  }

  return (
    <WorkoutActiveSession
      clientId={client.id}
      clientRoutineId={activeLink?.id ?? null}
      routineDay={currentDay}
      routineName={routine.name}
      previousByExercise={previousByExercise}
      personalRecords={personalRecords || []}
    />
  );
}
