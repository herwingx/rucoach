"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseMedia } from "@/components/client/exercise-media";
import { swapExerciseForClient } from "@/app/actions/routine-overrides";
import { toast } from "sonner";
import { Search, ArrowRight, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import type { Exercise } from "@/lib/types";
import { exName } from "@/lib/exercise-i18n";
import { cn } from "@/lib/utils";

interface ExerciseSwapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientRoutineId: string;
  originalRoutineExerciseId: number;
  originalExercise: Exercise;
  onSwapped?: () => void;
}

export function ExerciseSwapDrawer({
  open,
  onOpenChange,
  clientRoutineId,
  originalRoutineExerciseId,
  originalExercise,
  onSwapped,
}: ExerciseSwapDrawerProps) {
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Cargar alternativas del mismo músculo primario al abrir
  useEffect(() => {
    if (!open || !originalExercise?.primary_muscle) return;

    setLoadingAlts(true);
    setSelected(null);
    setSearch("");
    setReason("");

    const supabase = createClient();
    void (async () => {
      try {
        const { data } = await supabase
          .from("exercises")
          .select("id, name, name_es, primary_muscle, equipment, equipment_es, gif_url, image_url, target_muscles_es, target_muscles")
          .eq("primary_muscle", originalExercise.primary_muscle)
          .neq("id", originalExercise.id)
          .order("name_es", { ascending: true })
          .limit(60);
        setAlternatives((data ?? []) as Exercise[]);
      } catch {
        // silent
      } finally {
        setLoadingAlts(false);
      }
    })();
  }, [open, originalExercise?.id, originalExercise?.primary_muscle]);

  const filtered = alternatives.filter((ex) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ex.name?.toLowerCase().includes(q) ||
      ex.name_es?.toLowerCase().includes(q) ||
      ex.equipment?.toLowerCase().includes(q) ||
      ex.equipment_es?.toLowerCase().includes(q)
    );
  });

  const handleConfirm = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await swapExerciseForClient({
        clientRoutineId,
        originalRoutineExerciseId,
        replacementExerciseId: selected.id,
        reason: reason.trim() || undefined,
      });

      if (result.success) {
        toast.success(
          `Ejercicio cambiado. Tu coach ha sido notificado automáticamente.`,
        );
        onOpenChange(false);
        onSwapped?.();
      } else {
        toast.error(result.error ?? "No se pudo cambiar el ejercicio.");
      }
    });
  };

  const origName = exName(originalExercise);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] flex flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden">
          <DrawerHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <RefreshCw className="size-4 text-amber-600" />
              </div>
              <DrawerTitle className="text-lg font-bold leading-tight">
                Cambiar ejercicio
              </DrawerTitle>
            </div>
            <DrawerDescription className="text-sm text-muted-foreground">
              Reemplaza{" "}
              <span className="font-semibold text-foreground">{origName}</span>{" "}
              por una alternativa del mismo músculo. Tu coach será notificado.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o equipo…"
                className="h-11 rounded-xl pl-10 border-border/60 bg-muted/30"
              />
            </div>

            {/* Lista de alternativas */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/10">
              {loadingAlts ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No se encontraron alternativas.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-border/40">
                  {filtered.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() =>
                        setSelected(selected?.id === ex.id ? null : ex)
                      }
                      className={cn(
                        "flex items-center gap-4 p-3 text-left transition-all hover:bg-accent",
                        selected?.id === ex.id &&
                          "bg-primary/5 ring-1 ring-inset ring-primary/20",
                      )}
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <ExerciseMedia
                            src={ex.gif_url}
                            fallbackSrc={ex.image_url}
                          alt={exName(ex)}
                          variant="thumb"
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="line-clamp-1 text-sm font-semibold">
                          {exName(ex)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ex.target_muscles_es?.[0] && (
                            <Badge
                              variant="secondary"
                              className="h-4 rounded px-1 text-[9px] font-bold uppercase"
                            >
                              {ex.target_muscles_es[0]}
                            </Badge>
                          )}
                          {(ex.equipment_es || ex.equipment) && (
                            <span className="text-[10px] text-muted-foreground">
                              {ex.equipment_es || ex.equipment}
                            </span>
                          )}
                        </div>
                      </div>
                      {selected?.id === ex.id && (
                        <div className="size-5 shrink-0 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            viewBox="0 0 12 12"
                            className="size-3 text-primary-foreground"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Razón (opcional) */}
            {selected && (
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Motivo (opcional)
                </FieldLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. La máquina está ocupada, prefiero cable…"
                  className="min-h-18 resize-none rounded-xl border-border/60 bg-muted/30 text-sm"
                />
              </Field>
            )}
          </div>

          <DrawerFooter className="pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selected || isPending}
              className="h-12 w-full rounded-xl text-sm font-bold"
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Cambiando…
                </>
              ) : selected ? (
                <>
                  Usar {exName(selected)}
                  <ArrowRight data-icon="inline-end" />
                </>
              ) : (
                "Selecciona una alternativa"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-10 text-sm text-muted-foreground"
            >
              Cancelar
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
