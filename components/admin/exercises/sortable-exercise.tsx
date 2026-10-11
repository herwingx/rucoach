'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  X,
  GripVertical,
  ImageOff,
  Link2,
  Unlink,
  Eye,
  MessageSquarePlus,
  MessageSquareText,
} from 'lucide-react'
import { Exercise } from '@/lib/types'
import { cn } from '@/lib/utils'
import { exName, exEquipment } from '@/lib/exercise-i18n'

/** Mapa de colores por letra de biserie */
const SUPERSET_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-violet-500/15', text: 'text-violet-500', ring: 'ring-violet-500/30' },
  B: { bg: 'bg-sky-500/15',    text: 'text-sky-500',    ring: 'ring-sky-500/30'    },
  C: { bg: 'bg-emerald-500/15',text: 'text-emerald-500',ring: 'ring-emerald-500/30'},
  D: { bg: 'bg-amber-500/15',  text: 'text-amber-500',  ring: 'ring-amber-500/30'  },
  E: { bg: 'bg-rose-500/15',   text: 'text-rose-500',   ring: 'ring-rose-500/30'   },
}

function getSupersetColor(group: string | null | undefined) {
  if (!group) return null
  return SUPERSET_COLORS[group.toUpperCase()] ?? SUPERSET_COLORS['A']
}

interface SortableExerciseProps {
  id: string
  dayId: string
  exerciseId: string
  sets: number
  reps: string
  restSeconds: number
  supersetGroup?: string | null
  notes?: string | null
  exerciseInfo?: Exercise
  onUpdate: (field: string, value: string | number) => void
  onRemove: () => void
  onToggleSuperset?: () => void   // añadir/quitar del siguiente grupo disponible
  onRemoveSuperset?: () => void   // quitar la biserie de este ejercicio
  onInspectExercise?: (exercise: Exercise) => void
}

export function SortableExercise({
  id,
  sets,
  reps,
  restSeconds,
  supersetGroup,
  notes,
  exerciseInfo,
  onUpdate,
  onRemove,
  onToggleSuperset,
  onRemoveSuperset,
  onInspectExercise,
}: SortableExerciseProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [showNotesInput, setShowNotesInput] = useState(Boolean(notes?.trim()))
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const color = getSupersetColor(supersetGroup)
  const hasNotes = Boolean(notes?.trim())

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/ex relative flex flex-col gap-3 rounded-2xl border bg-card p-3.5 sm:p-4 transition-all duration-300',
        isDragging
          ? 'z-50 opacity-90 shadow-2xl ring-2 ring-primary/40 scale-[1.02]'
          : 'hover:shadow-md',
        supersetGroup && color
          ? `border-2 ${color.ring} ring-2 ${color.ring}`
          : 'border-border/60 hover:border-primary/30',
      )}
    >
      {/* Badge biserie */}
      {supersetGroup && color && (
        <div
          className={cn(
            'absolute -top-3 left-4 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm',
            color.bg,
            color.text,
          )}
        >
          <Link2 className="size-2.5" />
          Biserie {supersetGroup}
        </div>
      )}

      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            className={cn(
              'flex items-center justify-center shrink-0 cursor-grab touch-none rounded-xl p-1.5 sm:p-2 text-muted-foreground/40 transition-colors',
              'hover:bg-primary/5 hover:text-primary active:cursor-grabbing',
              'min-h-10 min-w-7 sm:min-w-8 size-9 sm:size-10',
            )}
            aria-label="Reordenar ejercicio"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => exerciseInfo && onInspectExercise?.(exerciseInfo)}
            disabled={!exerciseInfo || !onInspectExercise}
            aria-label={`Ver ficha técnica de ${exName(exerciseInfo)}`}
            title="Ver ficha técnica del ejercicio"
            className={cn(
              'relative size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/20 shadow-inner text-left',
              exerciseInfo && onInspectExercise && 'cursor-pointer ring-primary/30 hover:ring-2',
            )}
          >
            {exerciseInfo?.gif_url && !imgFailed ? (
              <img
                src={exerciseInfo.gif_url}
                alt={exName(exerciseInfo)}
                className="size-full object-cover transition-transform duration-500 group-hover/ex:scale-110"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center bg-muted/30 text-muted-foreground/40">
                <ImageOff className="size-5 opacity-40" aria-hidden />
              </div>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => exerciseInfo && onInspectExercise?.(exerciseInfo)}
              disabled={!exerciseInfo || !onInspectExercise}
              className={cn(
                'line-clamp-1 text-left text-sm font-bold tracking-tight text-foreground group-hover/ex:text-primary transition-colors',
                exerciseInfo && onInspectExercise && 'hover:underline',
              )}
            >
              {exName(exerciseInfo)}
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {(exerciseInfo?.target_muscles_es?.[0] || exerciseInfo?.primary_muscle) && (
                <Badge
                  variant="secondary"
                  className="h-5 rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary/80 border-0"
                >
                  {exerciseInfo.target_muscles_es?.[0] || exerciseInfo.primary_muscle}
                </Badge>
              )}
              {exEquipment(exerciseInfo) && (
                <span className="text-[11px] font-medium text-muted-foreground opacity-80">
                  {exEquipment(exerciseInfo)}
                </span>
              )}
            </div>
          </div>

          {/* Acciones en móvil (esquina superior derecha) */}
          <div className="flex items-center gap-0.5 shrink-0 sm:hidden">
            {exerciseInfo && onInspectExercise && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-xl text-muted-foreground/60 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => onInspectExercise(exerciseInfo)}
                aria-label="Ver ficha técnica"
                title="Ver ficha técnica"
              >
                <Eye className="size-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 shrink-0 rounded-xl transition-colors',
                hasNotes || showNotesInput
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground/60 hover:bg-primary/10 hover:text-primary',
              )}
              onClick={() => setShowNotesInput((prev) => !prev)}
              aria-label="Indicación para el ejercicio"
              title="Añadir o editar indicación para el cliente"
            >
              {hasNotes ? (
                <MessageSquareText className="size-4" />
              ) : (
                <MessageSquarePlus className="size-4" />
              )}
            </Button>

            {supersetGroup ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-xl text-muted-foreground/60 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                onClick={onRemoveSuperset}
                aria-label="Quitar de biserie"
                title="Quitar de biserie"
              >
                <Unlink className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-xl text-muted-foreground/60 hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                onClick={onToggleSuperset}
                aria-label="Añadir a biserie"
                title="Añadir a biserie (unir con ejercicio anterior)"
              >
                <Link2 className="size-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-xl text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={onRemove}
              aria-label="Quitar ejercicio"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex w-full items-end justify-between gap-3 border-t border-border/40 pt-3 sm:w-auto sm:border-0 sm:pt-0">
          <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-end sm:gap-2.5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Series
              </span>
              <Input
                type="number"
                inputMode="numeric"
                value={sets}
                min={1}
                aria-label="Series"
                onChange={(e) => onUpdate('sets', Math.max(1, Number(e.target.value) || 1))}
                className="h-10 w-full sm:w-14 rounded-xl border-border/80 bg-background px-2 text-center font-bold tabular-nums ring-primary/10 focus-visible:ring-4"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Objetivo / Reps
              </span>
              <Input
                value={reps}
                aria-label="Objetivo o repeticiones"
                onChange={(e) => onUpdate('reps', e.target.value)}
                placeholder="10-12"
                className="h-10 w-full sm:w-32 rounded-xl border-border/80 bg-background px-2.5 sm:px-3 text-sm font-medium ring-primary/10 focus-visible:ring-4"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Pausa (s)
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={5}
                value={restSeconds}
                aria-label="Descanso en segundos"
                onChange={(e) => onUpdate('restSeconds', Number(e.target.value) || 0)}
                className="h-10 w-full sm:w-16 rounded-xl border-border/80 bg-background px-2 text-center font-bold tabular-nums ring-primary/10 focus-visible:ring-4"
              />
            </div>
          </div>

          {/* Acciones en desktop: ficha + nota + biserie + eliminar */}
          <div className="hidden sm:flex items-center gap-1">
            {exerciseInfo && onInspectExercise && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-xl text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => onInspectExercise(exerciseInfo)}
                aria-label="Ver ficha técnica"
                title="Ver ficha técnica"
              >
                <Eye className="size-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-9 shrink-0 rounded-xl transition-colors',
                hasNotes || showNotesInput
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground/50 hover:bg-primary/10 hover:text-primary',
              )}
              onClick={() => setShowNotesInput((prev) => !prev)}
              aria-label="Indicación para el ejercicio"
              title="Añadir o editar indicación para el cliente"
            >
              {hasNotes ? (
                <MessageSquareText className="size-4" />
              ) : (
                <MessageSquarePlus className="size-4" />
              )}
            </Button>

            {supersetGroup ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-xl text-muted-foreground/50 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                onClick={onRemoveSuperset}
                aria-label="Quitar de biserie"
                title="Quitar de biserie"
              >
                <Unlink className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-xl text-muted-foreground/50 hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                onClick={onToggleSuperset}
                aria-label="Añadir a biserie"
                title="Añadir a biserie (unir con ejercicio anterior)"
              >
                <Link2 className="size-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-xl text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={onRemove}
              aria-label="Quitar ejercicio"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Campo de indicación específica del ejercicio (notes) */}
      {(showNotesInput || hasNotes) && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <MessageSquareText className="size-4 shrink-0 text-primary" aria-hidden />
          <Input
            value={notes ?? ''}
            onChange={(e) => onUpdate('notes', e.target.value)}
            placeholder="Indicación del coach para este ejercicio (ej. RIR 1, pausa 2s abajo, cuidar codos)..."
            aria-label="Indicación del coach para este ejercicio"
            className="h-8 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
          />
          {hasNotes && (
            <button
              type="button"
              onClick={() => {
                onUpdate('notes', '')
                setShowNotesInput(false)
              }}
              className="text-muted-foreground/60 hover:text-destructive p-1 rounded-md transition-colors"
              aria-label="Borrar indicación"
              title="Borrar indicación"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

