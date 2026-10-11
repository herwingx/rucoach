import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Award, Sparkles, TrendingUp } from "lucide-react";
import {
  VolumeChartLazy,
  ExerciseProgressChartLazy,
} from "@/components/charts/progress-charts-lazy";
import {
  CLIENT_DATA_PAGE_SHELL,
  ClientIncompleteProfileCard,
  ClientStackPageHeader,
} from "@/components/client/client-app-page-parts";
import {
  buildExerciseProgressFromLogs,
  exerciseOptionsFromPoints,
  mergePrEventsIntoPoints,
} from "@/lib/client-exercise-progress";
import { exerciseUsesExternalLoad } from "@/lib/exercise-tracking";
import {
  computeStrengthProgressInsight,
  computeVolumeInsightFromVolumes,
} from "@/lib/progress-insights";

export default async function ClientProgressPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data: clientRecord } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientRecord) {
    return (
      <>
        <ClientStackPageHeader
          title="Progreso"
          subtitle="Completa tu perfil para ver volumen, PRs e insights."
        />
        <div className={CLIENT_DATA_PAGE_SHELL}>
          <ClientIncompleteProfileCard />
        </div>
      </>
    );
  }

  const clientId = clientRecord.id as string;

  const [
    { data: completedSessionsDesc },
    { data: prRowsDesc },
    { data: exerciseLogRows },
  ] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("started_at,total_volume_kg,status")
      .eq("client_id", clientId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(60),
    supabase
      .from("pr_events")
      .select(
        "achieved_at,weight_kg,reps,exercise_id,exercises(name,name_es,primary_muscle,exercise_type,uses_external_load,equipment)",
      )
      .eq("client_id", clientId)
      .order("achieved_at", { ascending: false })
      .limit(250),
    supabase
      .from("exercise_logs")
      .select(
        `exercise_id, exercise_name, weight_kg, reps, is_warmup, workout_session_id,
           exercises(name, name_es, exercise_type, uses_external_load, equipment),
           workout_sessions!inner(started_at, client_id, status)`,
      )
      .eq("workout_sessions.client_id", clientId)
      .eq("workout_sessions.status", "completed")
      .order("workout_session_id", { ascending: false })
      .limit(1000),
  ]);

  const completedSessions = [...(completedSessionsDesc ?? [])].reverse();
  const prRows = [...(prRowsDesc ?? [])].reverse();

  const loadAwarePrRows = prRows.filter((r) => {
    const ex =
      r.exercises && !Array.isArray(r.exercises)
        ? (r.exercises as {
            exercise_type?: string | null;
            uses_external_load?: boolean | null;
            equipment?: string | null;
          })
        : Array.isArray(r.exercises)
          ? r.exercises[0]
          : null;
    return exerciseUsesExternalLoad(
      ex?.exercise_type,
      ex?.uses_external_load,
      ex?.equipment,
    );
  });

  const loadAwareExerciseLogRows = (exerciseLogRows ?? []).filter((r) => {
    const ex =
      r.exercises && !Array.isArray(r.exercises)
        ? (r.exercises as {
            exercise_type?: string | null;
            uses_external_load?: boolean | null;
            equipment?: string | null;
          })
        : Array.isArray(r.exercises)
          ? r.exercises[0]
          : null;
    return exerciseUsesExternalLoad(
      ex?.exercise_type,
      ex?.uses_external_load,
      ex?.equipment,
    );
  });

  const fromLogs = buildExerciseProgressFromLogs(loadAwareExerciseLogRows);
  const nameById = new Map(fromLogs.nameById);
  const pointsByExerciseId = mergePrEventsIntoPoints(
    fromLogs.pointsByExerciseId,
    nameById,
    loadAwarePrRows,
  );
  const exercises = exerciseOptionsFromPoints(pointsByExerciseId, nameById);

  const now = new Date();

  const strengthEntries = exercises.map((ex) => ({
    name: ex.name,
    points: (pointsByExerciseId[ex.id] || []).map((p) => ({
      achieved_at:
        typeof p.achieved_at === "string"
          ? p.achieved_at
          : new Date(p.achieved_at).toISOString(),
      weight_kg: p.weight_kg,
    })),
  }));
  const strengthInsight = computeStrengthProgressInsight(strengthEntries, now);

  const volumeSeries = (completedSessions || [])
    .map((s) => {
      const raw = s.total_volume_kg;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    })
    .filter((v): v is number => v != null);
  const volumeInsight = computeVolumeInsightFromVolumes(volumeSeries);

  const sessionCountForChart = (completedSessions || []).length;
  const exerciseTrackCount = exercises.length;
  const progressSubtitle =
    sessionCountForChart === 0 && exerciseTrackCount === 0
      ? "Sin datos aún · completa entrenos para ver volumen y curvas por ejercicio."
      : `${sessionCountForChart} ${sessionCountForChart === 1 ? "sesión" : "sesiones"} en volumen · ${exerciseTrackCount} ${exerciseTrackCount === 1 ? "ejercicio en seguimiento" : "ejercicios en seguimiento"}`;

  return (
    <>
      <ClientStackPageHeader title="Progreso" subtitle={progressSubtitle} />

      <div
        className={`${CLIENT_DATA_PAGE_SHELL} grid gap-6 lg:grid-cols-12 lg:items-start`}
      >
        <aside className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-4 lg:sticky lg:top-[calc(112px+1.5rem)] lg:self-start">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl transition-all hover:shadow-lg">
            <CardHeader className="pb-5 pt-6 px-6">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-transform active:scale-95">
                  <Sparkles className="size-5 text-primary" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold tracking-tight">Análisis Inteligente</CardTitle>
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Insights pro</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-0">
              {strengthInsight.status === "ok" &&
                strengthInsight.recentMilestone && (
                  <div className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-5 ring-1 ring-primary/10 transition-all hover:bg-primary/10">
                    <div className="absolute -right-2 -top-2 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12">
                      <Award className="size-20 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1 bg-primary rounded-md shadow-sm">
                        <Award className="size-3.5 text-primary-foreground" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Nuevo Récord Personal
                      </p>
                    </div>
                    <p className="text-xl font-black leading-none tracking-tight text-foreground">
                      {strengthInsight.recentMilestone.name}
                    </p>
                    <p className="mt-3 text-3xl font-black tabular-nums tracking-tighter text-primary">
                      {strengthInsight.recentMilestone.weight_kg.toFixed(1)} <span className="text-lg font-bold">kg</span>
                    </p>
                    <p className="mt-4 text-xs font-medium text-muted-foreground leading-relaxed">
                      ¡Brutal! Superaste tu marca anterior. Tu técnica y consistencia están dando frutos.
                    </p>
                  </div>
                )}

              {strengthInsight.status === "ok" &&
              strengthInsight.deltaPct > 0 ? (
                <div className="group rounded-2xl border bg-muted/20 p-5 transition-all hover:bg-muted/30">
                  <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      Progreso de Carga
                    </p>
                    <TrendingUp className="size-3.5 text-primary" />
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-lg font-black leading-none text-foreground">
                      {strengthInsight.exerciseName}
                    </p>
                    <p className="text-2xl font-black tabular-nums text-primary">
                      +{strengthInsight.deltaPct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5 ring-1 ring-border/20">
                       <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, strengthInsight.deltaPct * 5)}%` }} />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Últimos 30 días</p>
                  </div>
                  <p className="mt-3 text-[11px] font-bold text-muted-foreground tabular-nums flex gap-2">
                    <span className="bg-background px-1.5 py-0.5 rounded border shadow-sm">{strengthInsight.fromKg.toFixed(1)} kg</span>
                    <span className="opacity-40">→</span>
                    <span className="bg-background px-1.5 py-0.5 rounded border shadow-sm text-foreground">{strengthInsight.toKg.toFixed(1)} kg</span>
                  </p>
                </div>
              ) : strengthInsight.status === "ok" &&
                strengthInsight.recentMilestone ? null : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-5 py-8 text-center transition-opacity hover:opacity-80">
                   <p className="text-sm font-bold text-foreground">Construyendo análisis...</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground text-pretty leading-relaxed">
                    Registra más sesiones del mismo ejercicio para desbloquear proyecciones de carga.
                  </p>
                </div>
              )}

              {volumeInsight.status === "ok" ? (
                <div className="group rounded-2xl border bg-muted/20 p-5 transition-all hover:bg-muted/30">
                   <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      Dinámica de Volumen
                    </p>
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-black leading-snug text-foreground">
                    {volumeInsight.direction === "up"
                      ? "Tendencia ascendente"
                      : volumeInsight.direction === "down"
                        ? "Ajuste de volumen detectado"
                        : "Consistencia sólida"}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums tracking-tighter text-primary">
                      {Math.abs(volumeInsight.diffPct).toFixed(1)}%
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {volumeInsight.diffPct >= 0 ? "incremento" : "decrecimiento"}
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] font-medium leading-relaxed text-muted-foreground/80 italic">
                    {volumeInsight.window === "4v4"
                      ? "Basado en balance de 4 vs 4 bloques de entrenamiento."
                      : "Comparativa de 3 vs 3 sesiones recientes."}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-5 py-8 text-center">
                  <p className="text-sm font-bold text-foreground">Faltan datos de volumen</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground text-pretty leading-relaxed">
                    {volumeInsight.sessionsWithVolume > 0 ? (
                      <>
                        Necesitamos <span className="tabular-nums font-black text-primary">{volumeInsight.needed}</span> sesiones más para calcular la curva de fatiga y progreso acumulado.
                      </>
                    ) : (
                      <>
                        Empieza a entrenar para generar tu primera tendencia de volumen.
                      </>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <section className="order-1 flex min-w-0 flex-col gap-6 lg:order-2 lg:col-span-8">
          <div className="grid gap-6">
            <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl transition-all hover:shadow-lg">
              <CardHeader className="pb-4 pt-6 px-6 border-b bg-muted/5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <TrendingUp className="size-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">Carga de Volumen</CardTitle>
                    <CardDescription className="text-xs font-medium">Kilogramos totales movilizados por sesión</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <VolumeChartLazy
                  sessions={(completedSessions || []).map((s) => {
                    const raw = s.total_volume_kg;
                    const n = typeof raw === "number" ? raw : Number(raw);
                    return {
                      started_at: s.started_at as string,
                      total_volume_kg: Number.isFinite(n) ? n : null,
                    };
                  })}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl transition-all hover:shadow-lg">
              <CardHeader className="pb-4 pt-6 px-6 border-b bg-muted/5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Award className="size-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">Progreso de Fuerza</CardTitle>
                    <CardDescription className="text-xs font-medium">Curva de rendimiento histórico y récords personales</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ExerciseProgressChartLazy
                  exercises={exercises}
                  pointsByExerciseId={pointsByExerciseId}
                  defaultExerciseId={exercises[0]?.id}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
