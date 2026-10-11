"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminCardWithActions,
  AdminCardHeaderWithActions,
  type AdminCardMenuSection,
} from "@/components/admin/admin-card-with-actions";
import { Eye, Edit2, Trash2, Search, Dumbbell } from "lucide-react";
import { deleteRoutine } from "@/app/actions/routine-builder";
import { getGoalLabel } from "@/lib/constants";
import { toast } from "sonner";

export type RoutineCardItem = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  level: string | null;
  duration_weeks: number | null;
  days_per_week: number | null;
  routine_days?: { id: string; is_rest_day?: boolean | null }[];
};

interface RoutineCardsClientProps {
  routines: RoutineCardItem[];
}

export function RoutineCardsClient({
  routines: initialRoutines,
}: RoutineCardsClientProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState(initialRoutines);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRoutines = useMemo(() => {
    return routines.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        (r.goal && getGoalLabel(r.goal).toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (levelFilter === "all") return true;
      return r.level === levelFilter;
    });
  }, [routines, search, levelFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const result = await deleteRoutine(deleteId);
      if (result.success) {
        setRoutines(routines.filter((r) => r.id !== deleteId));
        toast.success("Rutina eliminada correctamente");
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(result.error || "No se pudo eliminar la rutina");
      }
    } catch {
      toast.error("No se pudo eliminar la rutina. Intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar rutina por nombre u objetivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card/60 border-border/50 backdrop-blur-xl shadow-sm focus-visible:ring-primary/20 text-sm transition-all hover:bg-card/80"
            />
          </div>
          <Tabs
            value={levelFilter}
            onValueChange={setLevelFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto bg-muted/50 p-1 h-11 rounded-xl border border-border/40 shadow-sm">
              <TabsTrigger value="all" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Todas
              </TabsTrigger>
              <TabsTrigger value="beginner" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Principiante
              </TabsTrigger>
              <TabsTrigger value="intermediate" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Intermedio
              </TabsTrigger>
              <TabsTrigger value="advanced" className="rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                Avanzado
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredRoutines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-card/40 py-12 text-center">
            <Dumbbell className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No se encontraron rutinas con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {filteredRoutines.map((routine) => {
              const configuredDays = routine.routine_days ?? [];
              const hasConfiguredDays = configuredDays.length > 0;
              const trainingDaysFromConfig = configuredDays.filter(
                (day) => !day.is_rest_day,
              ).length;
              const daysPerWeek = hasConfiguredDays
                ? trainingDaysFromConfig
                : (routine.days_per_week ?? 0);
              const durationWeeks = routine.duration_weeks ?? 0;
              const intensity = Math.min(100, Math.round((daysPerWeek / 7) * 100));
              const volumeLabel =
                daysPerWeek >= 6
                  ? "Alta frecuencia"
                  : daysPerWeek >= 4
                    ? "Frecuencia media"
                    : "Frecuencia baja";

              const menuSections: AdminCardMenuSection[] = [
                {
                  items: [
                    {
                      label: "Ver",
                      icon: <Eye className="mr-2 size-4" />,
                      href: `/admin/routines/${routine.id}`,
                    },
                    {
                      label: "Editar",
                      icon: <Edit2 className="mr-2 size-4" />,
                      href: `/admin/routines/${routine.id}/edit`,
                    },
                  ],
                },
                {
                  separatorBefore: true,
                  items: [
                    {
                      label: "Eliminar",
                      icon: <Trash2 className="mr-2 size-4" />,
                      onClick: () => {
                        setDeleteId(routine.id);
                        setDeleteName(routine.name);
                      },
                      variant: "destructive" as const,
                    },
                  ],
                },
              ];

              return (
                <AdminCardWithActions
                  key={routine.id}
                  menuSections={menuSections}
                  className="h-full"
                  cardClassName="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/50 bg-card/60 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:-translate-y-1 group"
                >
                  <AdminCardHeaderWithActions menuSections={menuSections}>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-[1.35rem] font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {routine.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full font-medium bg-secondary/70 text-secondary-foreground border-transparent">
                          {volumeLabel}
                        </Badge>
                        <Badge variant="outline" className="px-2.5 py-0.5 rounded-full font-medium border-border/60 text-muted-foreground bg-background/50">
                          {routine.goal
                            ? getGoalLabel(routine.goal)
                            : "Objetivo libre"}
                        </Badge>
                      </div>
                    </div>
                  </AdminCardHeaderWithActions>
                  <CardContent className="flex flex-1 flex-col p-5 pt-3">
                    <div className="flex flex-1 flex-col gap-5">
                      {routine.description ? (
                        <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                          {routine.description}
                        </p>
                      ) : (
                        <p className="text-[13px] leading-relaxed text-muted-foreground/60 italic">
                          Sin descripción adicional.
                        </p>
                      )}
                      <div className="flex flex-col gap-2.5 text-sm">
                        <div className="flex justify-between items-center border-b border-border/30 pb-2">
                          <span className="text-muted-foreground font-medium">Nivel</span>
                          <span className="capitalize font-semibold text-foreground/90">
                            {routine.level === "beginner"
                              ? "Principiante"
                              : routine.level === "intermediate"
                                ? "Intermedio"
                                : routine.level === "advanced"
                                  ? "Avanzado"
                                  : routine.level || "No especificado"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/30 pb-2">
                          <span className="text-muted-foreground font-medium">Duración</span>
                          <span className="font-semibold text-foreground/90">{durationWeeks || "-"} semanas</span>
                        </div>
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-muted-foreground font-medium">
                            Días/semana
                          </span>
                          <span className="font-semibold text-foreground/90">{daysPerWeek}</span>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-col gap-3 rounded-[1rem] border border-border/40 bg-background/30 p-4 shadow-inner ring-1 ring-inset ring-black/5 dark:ring-white/5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Carga semanal</span>
                          <span className="text-primary">{intensity}%</span>
                        </div>
                        <div className="overflow-hidden rounded-full border border-border/50 bg-muted/60 h-2.5">
                          <div
                            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full shadow-md shadow-primary/30"
                            style={{ width: `${Math.max(intensity, 8)}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground/80 leading-snug">
                          Carga estimada por frecuencia para planificación semanal.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </AdminCardWithActions>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleteName}&quot; junto con todos sus días y
              ejercicios configurados. Esta acción no se puede deshacer. Nota: no
              podrás eliminar una rutina si está asignada a clientes o tiene
              sesiones registradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RoutineCardsClient;
