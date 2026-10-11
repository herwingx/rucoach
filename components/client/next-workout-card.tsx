"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Dumbbell, Clock, ChevronRight, Trophy } from "lucide-react"
import Link from "next/link"
import type { RoutineDay, RoutineExercise } from "@/lib/types"

interface NextWorkoutCardProps {
  routineDay?: RoutineDay & { routine_exercises?: RoutineExercise[] }
  routineName?: string
  /** True cuando hay rutina activa pero aún no hay `routineDay` (no confundir con “sin rutina”). */
  hasAssignedRoutine?: boolean
  isRoutineCompleted?: boolean
}

export function NextWorkoutCard({
  routineDay,
  routineName,
  hasAssignedRoutine,
  isRoutineCompleted,
}: NextWorkoutCardProps) {
  if (isRoutineCompleted) {
    return (
      <Card className="overflow-hidden border-success/30 shadow-sm bg-gradient-to-br from-success/5 via-background to-background rounded-3xl">
        <CardContent className="p-8 sm:p-10 text-center flex flex-col items-center">
          <div className="size-20 rounded-full bg-success/20 ring-8 ring-success/5 flex items-center justify-center mb-8 animate-bounce">
            <Trophy className="size-10 text-success" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black mb-4 text-foreground tracking-tighter">¡LEGADO COMPLETADO!</h3>
          <p className="text-base font-medium text-muted-foreground max-w-md text-balance mb-10 leading-relaxed">
            Has masterizado este ciclo de entrenamiento. Tu coach ha sido notificado para preparar tu siguiente etapa de crecimiento.
          </p>
          <Button variant="outline" className="h-12 px-8 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95" asChild>
            <Link href="/client/routines">Ver resumen final</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!routineDay) {
    if (hasAssignedRoutine) {
      return (
        <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            <div className="size-16 rounded-2xl bg-muted/20 mx-auto mb-6 flex items-center justify-center border border-dashed border-border">
              <Clock className="size-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">Bloque de Recuperación</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Tu ciclo actual no tiene sesiones programadas para hoy. Aprovecha para optimizar tu descanso.
            </p>
          </CardContent>
        </Card>
      )
    }
    return (
      <Card className="overflow-hidden border-dashed border-border/60 bg-muted/5 rounded-3xl">
        <CardContent className="p-10 text-center">
          <div className="size-16 rounded-2xl bg-muted/20 mx-auto mb-6 flex items-center justify-center">
            <Dumbbell className="size-8 text-muted-foreground/20" />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2">Esperando Programación</h3>
          <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Tu coach está diseñando tu próximo plan de batalla. Recibirás una notificación cuando esté listo.
          </p>
        </CardContent>
      </Card>
    )
  }

  const exerciseCount = routineDay.routine_exercises?.length || 0
  const estimatedTime = exerciseCount * 10 // Realer estimate

  return (
    <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm transition-all hover:bg-card">
      <CardHeader className="pb-6 pt-8 px-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Siguiente Misión</span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Día {routineDay.day_number}
              {routineDay.day_name && (
                <span className="ml-2 text-muted-foreground/40 font-bold">·</span>
              )}
              {routineDay.day_name && (
                <span className="ml-2 text-primary uppercase text-sm tracking-widest font-black leading-none">
                  {routineDay.day_name}
                </span>
              )}
            </CardTitle>
          </div>
          <Badge className="w-fit font-black text-[10px] uppercase tracking-widest px-3 py-1.5 bg-muted/20 text-muted-foreground border-none rounded-xl">
            {routineName}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 sm:px-8 pb-8 flex flex-col gap-8">
        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-border/40">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tabular-nums leading-none tracking-tighter">{exerciseCount}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Ejercicios</span>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-border/40">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tabular-nums leading-none tracking-tighter">{estimatedTime}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Min aprox.</span>
            </div>
          </div>
        </div>

        {/* Exercise preview - Premium List */}
        {routineDay.routine_exercises && routineDay.routine_exercises.length > 0 && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Contenido de la sesión</span>
            <div className="flex flex-col gap-2.5">
              {routineDay.routine_exercises.slice(0, 3).map((ex, i) => (
                <div 
                  key={ex.id}
                  className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/40 bg-background/40 transition-all hover:bg-background hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-black text-muted-foreground/50 border border-border/40 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                      {i + 1}
                    </span>
                    <span className="truncate font-black text-sm tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {ex.exercises?.name_es || ex.exercises?.name || 'Ejercicio'}
                    </span>
                  </div>
                  <Badge variant="outline" className="h-6 shrink-0 rounded-lg font-black text-[9px] tabular-nums tracking-widest border-border/60 text-muted-foreground/60 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                    {ex.sets} SETS <span className="mx-1 text-muted-foreground/20">×</span> {ex.reps || 'VAR'}
                  </Badge>
                </div>
              ))}
              {exerciseCount > 3 && (
                <div className="flex items-center justify-center py-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    +{exerciseCount - 3} ejercicios para completar hoy
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start button CTA */}
        <Button asChild className="h-14 w-full text-base font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0] active:scale-[0.98] group">
          <Link href={`/client/workout/start`}>
            <Play className="size-5 mr-3 fill-current shrink-0 group-hover:scale-125 transition-transform duration-300" />
            Comenzar Entrenamiento
            <ChevronRight className="size-5 ml-auto opacity-50 group-hover:opacity-100 transition-all" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
