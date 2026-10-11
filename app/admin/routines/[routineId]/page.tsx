import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Pencil, Sparkles } from "lucide-react";
import { DeleteRoutineButton } from "./delete-routine-button";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { RoutineDayCards } from "@/components/routines/routine-day-cards";
import {
  ADMIN_DATA_PAGE_SHELL,
  AdminPageHeader,
} from "@/components/admin/admin-page-header";

type RoutineDayRow = { is_rest_day: boolean };

interface Props {
  params: Promise<{ routineId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { routineId } = await params;
  const supabase = await createClient();
  const { data: routine } = await supabase
    .from("routines")
    .select("name")
    .eq("id", routineId)
    .single();
  return {
    title: routine?.name || "Rutina",
  };
}

export default async function RoutineDetailsPage({ params }: Props) {
  const user = await getAuthUser();
  const { routineId } = await params;

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: routine } = await supabase
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

  if (!routine) {
    redirect("/admin/routines");
  }
  const configuredDays = routine.routine_days ?? [];
  const hasConfiguredDays = configuredDays.length > 0;
  const trainingDaysPerWeek = hasConfiguredDays
    ? (configuredDays as RoutineDayRow[]).filter((day) => !day.is_rest_day)
        .length
    : (routine.days_per_week ?? 0);

  return (
    <div className="bg-background">
      <AdminPageHeader
        title={routine.name}
        backHref="/admin/routines"
        backLabel="Volver a rutinas"
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{routine.level || "Nivel libre"}</Badge>
            <Badge variant="outline">
              {routine.goal || "Objetivo general"}
            </Badge>
          </div>
        }
        actions={
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              asChild
              className="flex-1 sm:flex-initial h-12 rounded-[1rem] font-bold text-[15px] shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <Link href={`/admin/routines/${routineId}/edit`}>
                <Pencil className="mr-2 size-5" />
                Editar Rutina
              </Link>
            </Button>
            <div className="flex-1 sm:flex-initial flex [&>*]:flex-1 sm:[&>*]:flex-initial">
              <DeleteRoutineButton
                routineId={routineId}
                routineName={routine.name}
              />
            </div>
          </div>
        }
      />

      <div className={ADMIN_DATA_PAGE_SHELL}>
        <div className="grid gap-6">
          {/* Routine Info */}
          <Card className="rounded-[1.5rem] border-border/50 bg-card/60 shadow-sm backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4.5" />
                </div>
                Información de la rutina
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-5 bg-card/40">
              <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Descripción</p>
                <p className="text-[14px] leading-relaxed text-foreground/90 font-medium">
                  {routine.description || "Sin descripción"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/40 bg-background/50 p-4 flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Nivel</p>
                  <p className="font-semibold text-[15px] capitalize text-foreground">
                    {routine.level || "No especificado"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 bg-background/50 p-4 flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Duración</p>
                  <p className="font-semibold text-[15px] text-foreground">
                    {routine.duration_weeks
                      ? `${routine.duration_weeks} semanas`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 bg-background/50 p-4 flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Días/semana</p>
                  <p className="font-semibold text-[15px] text-foreground">{trainingDaysPerWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Plan semanal</h2>
            </div>
            <RoutineDayCards days={routine.routine_days || []} />
          </section>
        </div>
      </div>
    </div>
  );
}
