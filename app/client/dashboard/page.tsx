import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateLevel, type RoutineDay } from "@/lib/types";
import { CLIENT_DASHBOARD_SESSIONS_CAP } from "@/lib/performance-limits";
import { getNextRoutineDay } from "@/lib/next-routine-day";
import { getNowInTimezone } from "@/lib/calendar-date";
import { ClientDashboardContent } from "./client-dashboard-content";

export default async function ClientDashboard() {
  const { user, profile } = await getAuthData();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();

  // Batch 1: client, userAchievements (independent, only need user.id)
  const [clientRes, userAchievementsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("user_id", user.id).single(),
    supabase
      .from("user_achievements")
      .select("*, achievements(*)")
      .eq("user_id", user.id),
  ]);

  const client = clientRes.data;
  const userAchievements = userAchievementsRes.data || [];

  // Obtener zona horaria del gimnasio (vía coach del cliente)
  let timeZone = "America/Mexico_City";
  if (client?.coach_id) {
    const { data: gymSettings } = await supabase
      .from("gym_settings")
      .select("timezone")
      .eq("admin_id", client.coach_id)
      .single();
    if (gymSettings?.timezone) {
      timeZone = gymSettings.timezone;
    }
  }
  const nowInTz = getNowInTimezone(timeZone);

  const startOfMonth = new Date(nowInTz);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Batch 2: workoutSessions, prsThisMonth, client_routines (need client.id)
  let workoutSessions:
    | {
        id?: string;
        total_volume_kg?: number | null;
        status?: string;
        started_at?: string;
        routine_day_id?: string | null;
      }[]
    | null = null;
  let prsThisMonth = 0;
  let routineId =
    (client as { assigned_routine_id?: string } | null)?.assigned_routine_id ??
    null;
  let latestCompletedRoutineDayId: string | null = null;
  let clientCurrentWeek = 1;
  let activeClientRoutineId: string | null = null;
  let overrideNextDayId: string | null = null;

  if (client?.id) {
    const [sessionsRes, prsRes, crRes, lastCompletedDayRes] = await Promise.all(
      [
        supabase
          .from("workout_sessions")
          .select("*")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(CLIENT_DASHBOARD_SESSIONS_CAP),
        supabase
          .from("pr_events")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)
          .gte("achieved_at", startOfMonth.toISOString()),
        supabase
          .from("client_routines")
          .select("id, routine_id, current_week, override_next_day_id")
          .eq("client_id", client.id)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("workout_sessions")
          .select("routine_day_id")
          .eq("client_id", client.id)
          .eq("status", "completed")
          .not("routine_day_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ],
    );
    workoutSessions = sessionsRes.data;
    prsThisMonth = prsRes.count ?? 0;
    if (!routineId) routineId = crRes.data?.routine_id ?? null;
    latestCompletedRoutineDayId =
      lastCompletedDayRes.data?.routine_day_id ?? null;

    // Store current_week and override info
    clientCurrentWeek = crRes.data?.current_week ?? 1;
    activeClientRoutineId = crRes.data?.id ?? null;
    overrideNextDayId =
      (crRes.data as { override_next_day_id?: string | null } | null)
        ?.override_next_day_id ?? null;
  }

  // Batch 3: routine with full details (need routineId)
  let assignedRoutine = null;
  let isRoutineCompleted = false;

  if (routineId) {
    const { data } = await supabase
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
      .single();
    assignedRoutine = data;

    if (assignedRoutine && assignedRoutine.duration_weeks) {
      isRoutineCompleted = clientCurrentWeek > assignedRoutine.duration_weeks;
    }
  }

  // Calculate level info
  const levelInfo = calculateLevel(profile?.xp_points || 0);

  // Completed sessions only (for volume, chart and count)
  const completedSessions = (workoutSessions || []).filter(
    (s: any) => s.status === "completed" && s.started_at,
  );

  // Sync prsThisMonth with admin logic: max(pr_events, exercise_logs with is_pr=true and !is_warmup)
  const monthStartMs = startOfMonth.getTime();
  const sessionIdsThisMonth = completedSessions
    .filter((s) => {
      if (!s.started_at || !s.id) return false;
      const t = new Date(s.started_at).getTime();
      return !Number.isNaN(t) && t >= monthStartMs;
    })
    .map((s) => s.id as string);

  if (sessionIdsThisMonth.length > 0) {
    const { data: prLogRows } = await supabase
      .from("exercise_logs")
      .select("workout_session_id, is_warmup")
      .eq("is_pr", true)
      .in("workout_session_id", sessionIdsThisMonth);
    const prLogsCount = (prLogRows || []).filter((r) => !r.is_warmup).length;
    prsThisMonth = Math.max(prsThisMonth, prLogsCount);
  }

  // Calculate total volume from completed sessions
  const totalVolume = completedSessions.reduce(
    (sum, s) => sum + (s.total_volume_kg || 0),
    0,
  );

  const formatDateInTimezone = (date: Date, tz: string): string => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  };

  const toDateKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const totalWorkoutsCompleted = completedSessions.length;
  const chartDataMap = new Map<string, number>();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(nowInTz);
    d.setDate(d.getDate() - i);
    chartDataMap.set(toDateKey(d), 0);
  }
  for (const s of completedSessions) {
    const dateStr = formatDateInTimezone(new Date(s.started_at!), timeZone);
    if (chartDataMap.has(dateStr)) {
      chartDataMap.set(dateStr, (chartDataMap.get(dateStr) || 0) + 1);
    }
  }
  const chartData = Array.from(chartDataMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sessions]) => ({ date, sessions }));

  const lastCompletedWithDayId =
    latestCompletedRoutineDayId ??
    (workoutSessions || []).find(
      (s) => s.status === "completed" && s.routine_day_id,
    )?.routine_day_id ??
    null;
  const routineDaysList = (assignedRoutine?.routine_days ?? []) as RoutineDay[];
  const overriddenDay = overrideNextDayId
    ? routineDaysList.find(
        (d) =>
          d.id === overrideNextDayId &&
          !d.is_rest_day &&
          Array.isArray(d.routine_exercises) &&
          d.routine_exercises.length > 0,
      ) ?? null
    : null;
  const nextWorkoutRoutineDay =
    overriddenDay ??
    getNextRoutineDay(routineDaysList, lastCompletedWithDayId);

  if (nextWorkoutRoutineDay?.routine_exercises?.length) {
    nextWorkoutRoutineDay.routine_exercises = [
      ...nextWorkoutRoutineDay.routine_exercises,
    ].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  if (
    activeClientRoutineId &&
    nextWorkoutRoutineDay?.routine_exercises?.length
  ) {
    const { applyExerciseOverrides } = await import(
      "@/app/actions/routine-overrides"
    );
    nextWorkoutRoutineDay.routine_exercises = await applyExerciseOverrides(
      activeClientRoutineId,
      nextWorkoutRoutineDay.routine_exercises,
      supabase,
    );
  }

  // Weekly progress (Monday to Sunday in gym timezone)
  const todayStr = toDateKey(nowInTz);
  const currentDayOfWeek = nowInTz.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayOfThisWeek = new Date(nowInTz);
  mondayOfThisWeek.setDate(nowInTz.getDate() + diffToMonday);
  mondayOfThisWeek.setHours(0, 0, 0, 0);

  const trainedDatesSet = new Set<string>(
    completedSessions.map((s) =>
      formatDateInTimezone(new Date(s.started_at!), timeZone),
    ),
  );

  const weekDayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const weekDaysStatus = weekDayLabels.map((label, idx) => {
    const d = new Date(mondayOfThisWeek);
    d.setDate(mondayOfThisWeek.getDate() + idx);
    const dateStr = toDateKey(d);
    return {
      label,
      dateStr,
      completed: trainedDatesSet.has(dateStr),
      isToday: dateStr === todayStr,
    };
  });

  const currentWeekDatesSet = new Set(weekDaysStatus.map((d) => d.dateStr));
  const workoutsThisWeek = completedSessions.filter((s) =>
    currentWeekDatesSet.has(
      formatDateInTimezone(new Date(s.started_at!), timeZone),
    ),
  ).length;

  const weeklyTarget =
    assignedRoutine?.days_per_week ||
    routineDaysList.filter((d) => !d.is_rest_day).length ||
    4;

  return (
    <ClientDashboardContent
      profile={profile}
      levelInfo={levelInfo}
      totalWorkouts={totalWorkoutsCompleted}
      totalVolume={totalVolume}
      prsThisMonth={prsThisMonth || 0}
      assignedRoutine={assignedRoutine}
      nextWorkoutRoutineDay={nextWorkoutRoutineDay}
      isRoutineCompleted={isRoutineCompleted}
      userAchievements={userAchievements || []}
      chartData={chartData}
      membershipEnd={client?.membership_end ?? null}
      currentWeek={clientCurrentWeek}
      durationWeeks={assignedRoutine?.duration_weeks ?? null}
      workoutsThisWeek={workoutsThisWeek}
      weeklyTarget={weeklyTarget}
      weekDaysStatus={weekDaysStatus}
    />
  );
}
