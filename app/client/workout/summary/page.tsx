import {
  ClientStackPageHeader,
  CLIENT_DATA_PAGE_SHELL,
} from "@/components/client/client-app-page-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkoutSessionSummary } from "@/app/actions/workout";
import { WorkoutSummaryClient } from "./workout-summary-client";

export default async function WorkoutSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <>
        <ClientStackPageHeader
          title="Resumen del entreno"
          subtitle="No se encontró la sesión"
          backHref="/client/workouts"
        />
        <div className={CLIENT_DATA_PAGE_SHELL}>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Falta `sessionId`</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Regresa al dashboard e intenta nuevamente.
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const summary = await getWorkoutSessionSummary(sessionId);

  if (!summary.success) {
    return (
      <>
        <ClientStackPageHeader
          title="Resumen del entreno"
          subtitle="No se pudo cargar la sesión"
          backHref="/client/workouts"
        />
        <div className={CLIENT_DATA_PAGE_SHELL}>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {summary.error}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const routineDayId = summary.session.routine_day_id;
  const sessionRow = summary.session as {
    client_id: string;
    duration_minutes: number | null;
    total_volume_kg: number | null;
    feeling_note: string | null;
    finished_at: string | null;
    started_at: string | null;
    routine_days?: {
      day_name: string | null;
      routines?: { name: string } | { name: string }[] | null;
    } | null;
  };

  const rd = sessionRow.routine_days;
  const routineDayMeta = rd && Array.isArray(rd) ? rd[0] : rd;
  const routines = routineDayMeta?.routines;
  const routineRow =
    routines && Array.isArray(routines) ? routines[0] : routines;
  const routineName = routineRow?.name;
  const dayName = routineDayMeta?.day_name;

  return (
    <>
      <ClientStackPageHeader
        title="Sesión Finalizada"
        subtitle="¡Gran trabajo! Hemos guardado tu progreso y actualizado tus sugerencias. Revisa los detalles abajo."
        backHref="/client/workouts"
      />
      <div className={CLIENT_DATA_PAGE_SHELL}>
        <WorkoutSummaryClient
          sessionId={sessionId}
          clientId={sessionRow.client_id}
          routineDayId={routineDayId}
          routineName={routineName}
          dayName={dayName}
          durationMinutes={sessionRow.duration_minutes}
          totalVolumeKg={sessionRow.total_volume_kg}
          finishedAt={sessionRow.finished_at}
          initialFeelingNote={sessionRow.feeling_note}
          stats={summary.stats}
          logs={summary.logs}
        />
      </div>
    </>
  );
}
