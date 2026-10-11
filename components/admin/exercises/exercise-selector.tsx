'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Exercise } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SearchIcon, X, Check, SlidersHorizontal, Loader2, Library, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { exName, exEquipment, exBodyParts, exTargetMuscles } from '@/lib/exercise-i18n'

interface ExerciseSelectorProps {
  exercises: Exercise[]
  onSelectExercises: (selectedIds: string[]) => void
  onClose?: () => void
  showCloseButton?: boolean
  loading?: boolean
}

const ITEMS_PER_PAGE = 30

export function ExerciseSelector({
  exercises,
  onSelectExercises,
  onClose,
  showCloseButton = false,
  loading = false,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [search, activeBodyPart])

  const bodyParts = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => {
      exBodyParts(ex).forEach((bp) => set.add(bp))
    })
    return Array.from(set).sort()
  }, [exercises])

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch = search
        ? exName(ex).toLowerCase().includes(search.toLowerCase())
        : true
      const matchBodyPart = activeBodyPart
        ? exBodyParts(ex).includes(activeBodyPart)
        : true

      return matchSearch && matchBodyPart
    })
  }, [exercises, search, activeBodyPart])

  const visibleExercises = useMemo(() => {
    return filteredExercises.slice(0, visibleCount)
  }, [filteredExercises, visibleCount])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredExercises.length) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [visibleCount, filteredExercises.length])

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleConfirm = () => {
    if (selectedIds.size === 0) return
    onSelectExercises(Array.from(selectedIds))
    setSelectedIds(new Set())
    onClose?.()
  }

  const clearFilters = () => {
    setSearch('')
    setActiveBodyPart(null)
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Header & Filters */}
      <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-md px-4 pt-5 pb-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="size-5" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="text-lg font-bold tracking-tight text-foreground">Añadir ejercicios</h3>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredExercises.length}</span> disponibles
                {selectedIds.size > 0 && (
                  <> · <span className="font-semibold text-primary">{selectedIds.size}</span> seleccionados</>
                )}
              </p>
            </div>
          </div>
          {showCloseButton && onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Busca por nombre o equipo..."
              className="h-11 rounded-2xl border-border/80 bg-background pl-10 ring-primary/10 transition-shadow focus-visible:ring-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Limpiar búsqueda"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-full hover:bg-transparent"
                onClick={() => setSearch('')}
              >
                <X className="size-3 text-muted-foreground" />
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
              <SlidersHorizontal className="size-3" aria-hidden />
              Zonas Musculares
            </div>
            <div className="flex w-full gap-2 overflow-x-auto no-scrollbar pb-1">
              <Badge
                role="button"
                tabIndex={0}
                variant={!activeBodyPart ? 'default' : 'secondary'}
                className={cn(
                  'h-8 shrink-0 cursor-pointer rounded-full px-3 text-xs transition-all',
                  !activeBodyPart ? 'shadow-sm ring-2 ring-primary/20' : 'hover:bg-secondary/80'
                )}
                onClick={() => setActiveBodyPart(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveBodyPart(null)
                  }
                }}
              >
                Todas
              </Badge>
              {bodyParts.map((bp) => (
                <Badge
                  key={bp}
                  role="button"
                  tabIndex={0}
                  variant={activeBodyPart === bp ? 'default' : 'outline'}
                  className={cn(
                    'h-8 shrink-0 cursor-pointer rounded-full px-3 text-xs capitalize transition-all',
                    activeBodyPart === bp ? 'shadow-sm ring-2 ring-primary/20' : 'text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                  onClick={() => setActiveBodyPart(activeBodyPart === bp ? null : bp)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveBodyPart(activeBodyPart === bp ? null : bp)
                    }
                  }}
                >
                  {bp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/5 px-4 py-4 sm:px-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 rounded-2xl border border-border/40 bg-card/50 p-2.5">
                <div className="size-16 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded-md bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 rounded-md bg-muted" />
                    <div className="h-4 w-20 rounded-md bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <div className="relative flex size-20 items-center justify-center rounded-3xl bg-muted/50 ring-1 ring-border/50">
              <SearchIcon className="size-8 text-muted-foreground/50" aria-hidden />
            </div>
            <div className="max-w-[240px] space-y-1">
              <p className="font-bold text-foreground">Sin resultados</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No encontramos ejercicios que coincidan con tu búsqueda.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl border-primary/20 bg-background"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-32">
            {visibleExercises.map((ex) => {
              const isSelected = selectedIds.has(ex.id)
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => toggleSelection(ex.id)}
                  className={cn(
                    'group relative flex items-center gap-4 rounded-2xl border p-2.5 text-left transition-all duration-300',
                    isSelected
                      ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/30 shadow-sm'
                      : 'border-border/60 bg-card hover:border-primary/30 hover:shadow-md'
                  )}
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                    {ex.gif_url ? (
                      <img
                        src={ex.gif_url}
                        alt=""
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground/40">
                        <Dumbbell className="size-6 opacity-20" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]">
                        <Check className="size-6 text-primary drop-shadow-sm" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-8">
                    <p className="line-clamp-1 text-sm font-bold capitalize tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {exName(ex)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {exTargetMuscles(ex).length > 0 && (
                        <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/5 text-primary/80 border-0">
                          {exTargetMuscles(ex)[0]}
                        </Badge>
                      )}
                      {exEquipment(ex) && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {exEquipment(ex)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'absolute right-3.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all duration-300',
                      isSelected
                        ? 'border-primary bg-primary scale-110'
                        : 'border-border bg-background group-hover:border-primary/40'
                    )}
                  >
                    {isSelected && <Check className="size-3.5 text-primary-foreground" strokeWidth={4} />}
                  </div>
                </button>
              )
            })}

            {/* Infinite Scroll Loader */}
            <div
              ref={loaderRef}
              className="flex items-center justify-center py-8"
            >
              {visibleCount < filteredExercises.length && (
                <div className="flex items-center gap-2 text-muted-foreground/60 animate-pulse">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-xs font-medium">Cargando más ejercicios...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-10 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={selectedIds.size === 0}
          size="lg"
          className={cn(
            "h-14 w-full rounded-2xl text-base font-bold shadow-xl transition-all duration-300 active:scale-[0.98]",
            selectedIds.size > 0 
              ? "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30" 
              : "bg-muted text-muted-foreground grayscale"
          )}
        >
          {selectedIds.size === 0 ? (
            'Selecciona para añadir'
          ) : (
            <span className="flex items-center gap-2">
              Añadir {selectedIds.size} {selectedIds.size === 1 ? 'ejercicio' : 'ejercicios'}
              <Check className="size-5" strokeWidth={3} />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
