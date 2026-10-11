import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Dumbbell, CalendarDays, Sigma } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminKpiStatCard } from "@/components/admin/admin-kpi-stat-card";
import {
  ADMIN_DATA_PAGE_SHELL,
  AdminPageHeader,
} from "@/components/admin/admin-page-header";
import RoutineCardsClient, {
  type RoutineCardItem,
} from "./routine-cards-client";

type RoutineDayRow = { id: string; is_rest_day: boolean | null };

type RoutineListRow = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  level: string | null;
  duration_weeks: number | null;
  days_per_week: number | null;
  routine_days: RoutineDayRow[] | null;
};

function toRoutineCardItem(r: RoutineListRow): RoutineCardItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    goal: r.goal,
    level: r.level,
    duration_weeks: r.duration_weeks,
    days_per_week: r.days_per_week,
    routine_days: r.routine_days ?? undefined,
  };
}

export default async function AdminRoutinesPage() {
  const { user, role } = await getAuthData();

  if (!user || role !== "admin") {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: routinesRaw } = await supabase
    .from("routines")
    .select(
      `
      id,
      name,
      description,
      goal,
      level,
      duration_weeks,
      days_per_week,
      routine_days (id, is_rest_day)
    `,
    )
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const safeRoutines = (routinesRaw ?? []) as RoutineListRow[];
  const routineCards = safeRoutines.map(toRoutineCardItem);
  const totalRoutines = safeRoutines.length;
  const totalWeeklyDays = safeRoutines.reduce(
    (acc, r) =>
      acc +
      (r.routine_days && r.routine_days.length > 0
        ? r.routine_days.filter((day) => !day.is_rest_day).length
        : (r.days_per_week ?? 0)),
    0,
  );
  const avgDuration =
    totalRoutines > 0
      ? Math.round(
          safeRoutines.reduce((acc, r) => acc + (r.duration_weeks ?? 0), 0) /
            totalRoutines,
        )
      : 0;

  return (
    <div className="min-h-dvh bg-background">
      <AdminPageHeader
        sticky
        title="Rutinas de Entrenamiento"
        description={
          <>
            {totalRoutines} rutina{totalRoutines !== 1 ? "s" : ""} activas
          </>
        }
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/routines/builder">
              <Plus className="mr-2 size-4" />
              Nueva Rutina (Builder)
            </Link>
          </Button>
        }
      />

      <div className={ADMIN_DATA_PAGE_SHELL}>
        {totalRoutines > 0 && (
          <section className="mb-6 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
            <AdminKpiStatCard
              icon={Dumbbell}
              value={totalRoutines}
              label="Rutinas"
            />
            <AdminKpiStatCard
              icon={CalendarDays}
              value={totalWeeklyDays}
              label="Días de entrenamiento / semana"
            />
            <AdminKpiStatCard
              className="col-span-full sm:col-span-1"
              icon={Sigma}
              value={`${avgDuration || "-"} sem`}
              label="Promedio duración"
            />
          </section>
        )}

        {routineCards.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No hay rutinas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No tienes rutinas creadas aún. Crea una nueva para asignarla a
                tus clientes.
              </p>
              <Button asChild>
                <Link href="/admin/routines/builder">Crear primera rutina</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <RoutineCardsClient routines={routineCards} />
        )}
      </div>
    </div>
  );
}
