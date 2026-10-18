"use client";

import React, { useMemo } from "react";
import {
  MUSCLES,
  MUSCLE_LABELS,
  exerciseMuscleWeights,
  type MuscleSlug,
} from "@/lib/anatomy/muscles";
import { BodyMap } from "@/components/anatomy/body-map";
import { X } from "lucide-react";

export interface MuscleExplorerExercise {
  id: string;
  primary_muscle?: string | null;
  secondary_muscles?: string[] | null;
  muscle_weights?: Record<string, number> | null;
}

export interface MuscleExplorerPanelProps {
  exercises: MuscleExplorerExercise[];
  selectedMuscle: MuscleSlug | null;
  onSelectMuscle: (muscle: MuscleSlug | null) => void;
  sex?: "male" | "female";
  compact?: boolean;
}

export function MuscleExplorerPanel({
  exercises,
  selectedMuscle,
  onSelectMuscle,
  sex = "male",
  compact = false,
}: MuscleExplorerPanelProps) {
  const counts = useMemo(() => {
    const map: Record<MuscleSlug, number> = {} as Record<MuscleSlug, number>;
    for (const m of MUSCLES) map[m] = 0;
    for (const ex of exercises) {
      const weights = exerciseMuscleWeights(ex);
      for (const m of MUSCLES) {
        if (weights[m]) {
          map[m] += 1;
        }
      }
    }
    return map;
  }, [exercises]);

  const load = useMemo(() => {
    if (!selectedMuscle) return {};
    return { [selectedMuscle]: 1 } as Partial<Record<MuscleSlug, number>>;
  }, [selectedMuscle]);

  const handleToggle = (m: MuscleSlug | null) => {
    if (!m) {
      onSelectMuscle(null);
      return;
    }
    onSelectMuscle(selectedMuscle === m ? null : m);
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-3 sm:p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-foreground">
            Explorador Anatómico
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            Toca un músculo en el mapa o en las etiquetas para filtrar ejercicios
            primarios y secundarios
          </p>
        </div>
        {selectedMuscle && (
          <button
            type="button"
            onClick={() => onSelectMuscle(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            <span>{MUSCLE_LABELS[selectedMuscle]}</span>
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className={compact ? "mx-auto max-w-[300px]" : "mx-auto max-w-[360px]"}>
        <BodyMap
          bare
          sex={sex}
          mode="volume"
          load={load}
          selected={selectedMuscle}
          onSelect={handleToggle}
        />
      </div>

      <div className="mchips mt-3">
        {MUSCLES.map((m) => {
          const isSelected = selectedMuscle === m;
          const count = counts[m] || 0;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleToggle(m)}
              className={`mchip ${isSelected ? "sel" : ""}`}
            >
              <span>{MUSCLE_LABELS[m]}</span>
              <span className="ml-1 opacity-60 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

