import { getAuthData, getCurrentClientRecord } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getNextWorkoutDay,
  suggestProgressionWeekly,
} from "@/app/actions/routine-assignment";
import {
  ClientRoutinesContent,
  type ClientRoutine,
  type RoutineSummary,
  type TrainDay,
  type Suggestion,
} from "./client-routines-content";

function countTrainingDaysPerWeek(
  routineDays:
    | { is_rest_day: boolean | null; routine_exercises?: { id: unknown }[] | null }[]
    | undefined
    | null,
  fallback: number,
): number {
  if (!routineDays?.length) return fallback;
  const n = routineDays.filter(
    (d) =>
      !d.is_rest_day &&
      (!Array.isArray(d.routine_exercises) || d.routine_exercises.length > 0),
  ).length;
  return n > 0 ? n : fallback;
}

type RoutineRowFromDb = Omit<RoutineSummary, "training_days_per_week"> & {
  routine_days?:
    | { is_rest_day: boolean | null; routine_exercises?: { id: unknown }[] | null }[]
    | null;
};

function normalizeClientRoutineRow(row: {
  id: string;
  routine_id: string;
  current_week: number;
  current_day_index: number;
  is_active: boolean;
  routines: RoutineRowFromDb | RoutineRowFromDb[] | null;
}): ClientRoutine | null {
  const r = row.routines;
  const routineRaw = Array.isArray(r) ? r[0] : r;
  if (!routineRaw) return null;
  const { routine_days: routineDays, ...routine } = routineRaw;
  const training_days_per_week = countTrainingDaysPerWeek(
    routineDays,
    routine.days_per_week ?? 0,
  );
  return {
    id: row.id,
    routine_id: row.routine_id,
    current_week: row.current_week,
    current_day_index: row.current_day_index,
    is_active: row.is_active,
    routines: {
      ...routine,
      training_days_per_week,
      description: routine.description ?? "",
    },
  };
}

export default async function ClientRoutinesPage() {
  const { user } = await getAuthData();

  if (!user) {
    redirect("/auth/login");
  }

  const [supabase, client] = await Promise.all([
    createClient(),
    getCurrentClientRecord(user.id),
  ]);

  if (!client) {
    return (
      <ClientRoutinesContent
        initialRoutines={[]}
        initialNextWorkout={null}
        initialSuggestions={[]}
        initialTrainDays={[]}
        initialScheduleRoutineId=""
      />
    );
  }

  const { data: clientRoutines } = await supabase
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
        description,
        routine_days ( id, day_number, day_name, is_rest_day, routine_exercises ( id ) )
      )
    `,
    )
    .eq("client_id", client.id)
    .eq("is_active", true);

  const normalized = (clientRoutines || [])
    .map((row) => normalizeClientRoutineRow(row as any))
    .filter((r): r is ClientRoutine => r !== null);

  let nextWorkout: Record<string, unknown> | null = null;
  let suggestions: Suggestion[] = [];
  let trainDays: TrainDay[] = [];
  let scheduleRoutineId = "";

  if (clientRoutines && clientRoutines.length > 0 && normalized[0]) {
    const rawRoutine = Array.isArray(clientRoutines[0].routines)
      ? clientRoutines[0].routines[0]
      : clientRoutines[0].routines;
    const rawDays = (
      rawRoutine as {
        routine_days?: {
          id: string;
          day_number: number;
          day_name?: string | null;
          is_rest_day?: boolean | null;
          routine_exercises?: { id: unknown }[] | null;
        }[];
      } | null
    )?.routine_days;

    trainDays = [...(rawDays ?? [])]
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .filter(
        (d) =>
          !d.is_rest_day &&
          Array.isArray(d.routine_exercises) &&
          d.routine_exercises.length > 0,
      )
      .map((d) => ({
        id: d.id,
        day_number: d.day_number,
        day_name: d.day_name,
        is_rest_day: d.is_rest_day,
      }));

    scheduleRoutineId = clientRoutines[0].id;

    try {
      const [nextWorkoutInfo, progressSuggestions] = await Promise.all([
        getNextWorkoutDay(clientRoutines[0].id),
        suggestProgressionWeekly(normalized[0].id),
      ]);
      nextWorkout = nextWorkoutInfo as Record<string, unknown>;
      suggestions = progressSuggestions;
    } catch (err) {
      console.error("Error prefetching routine workout or suggestions:", err);
    }
  }

  return (
    <ClientRoutinesContent
      initialRoutines={normalized}
      initialNextWorkout={nextWorkout}
      initialSuggestions={suggestions}
      initialTrainDays={trainDays}
      initialScheduleRoutineId={scheduleRoutineId}
    />
  );
}
