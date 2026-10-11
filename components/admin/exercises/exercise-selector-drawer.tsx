'use client'

import { Exercise } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ExerciseSelector } from './exercise-selector'

interface ExerciseSelectorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: Exercise[]
  onSelectExercises: (selectedIds: string[]) => void
  loading?: boolean
  existingExerciseIds?: string[]
}

export function ExerciseSelectorDrawer({
  open,
  onOpenChange,
  exercises,
  onSelectExercises,
  loading = false,
  existingExerciseIds,
}: ExerciseSelectorDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg lg:max-w-xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Ejercicios</SheetTitle>
          <SheetDescription>
            Busca, filtra y marca los ejercicios para añadirlos al día seleccionado.
          </SheetDescription>
        </SheetHeader>
        <ExerciseSelector
          exercises={exercises}
          onSelectExercises={onSelectExercises}
          onClose={() => onOpenChange(false)}
          loading={loading}
          existingExerciseIds={existingExerciseIds}
        />
      </SheetContent>
    </Sheet>
  )
}
