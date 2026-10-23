'use client'

import { useState } from 'react'
import { BODY_PATHS } from '@/lib/anatomy/body-paths'
import {
  MUSCLES,
  INERT,
  MUSCLE_NAMES_ES,
  type MuscleSlug,
  type ThresholdRule,
  levelsOf,
} from '@/lib/anatomy/muscles'
import {
  FATIGUE_LEVELS,
  STRENGTH_LEVELS,
  STRENGTH_FLOOR,
  type MuscleRecoveryStatus,
} from '@/lib/anatomy/recovery'
import {
  PAIN_ZONE_LABELS_ES,
  type PainEntry,
  type PainZone,
} from '@/lib/anatomy/pain-map'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Activity, Flame, ShieldAlert, Sparkles } from 'lucide-react'

export interface BodyMapProps {
  gender?: 'male' | 'female'
  sex?: 'male' | 'female'
  body?: 'male' | 'female'
  view?: 'both' | 'front' | 'back'
  mode?: 'volume' | 'recovery' | 'strength' | 'clinical'
  load?: Partial<Record<MuscleSlug, number>>
  thresholds?: ThresholdRule[]
  recovery?: Partial<Record<MuscleSlug, MuscleRecoveryStatus>>
  strength?: Partial<Record<MuscleSlug, number>>
  painEntries?: PainEntry[]
  onSelectMuscle?: (muscle: MuscleSlug | PainZone) => void
  onSelect?: (muscle: MuscleSlug | null) => void
  onMuscle?: (muscle: MuscleSlug) => void
  selectedMuscle?: string | null
  selected?: string | null
  interactive?: boolean
  bare?: boolean
  showLegend?: boolean
  className?: string
}

export function BodyMapLegend({
  lessLabel = 'Menos',
  moreLabel = 'Más',
}: {
  lessLabel?: string
  moreLabel?: string
} = {}) {
  return (
    <div className="hm-legend" aria-label="Menos a más volumen">
      <span>{lessLabel}</span>
      <div className="hm-c l0" />
      <div className="hm-c l1" />
      <div className="hm-c l2" />
      <div className="hm-c l3" />
      <div className="hm-c l4" />
      <span>{moreLabel}</span>
    </div>
  )
}

export function FatigueLegend() {
  return (
    <div className="hm-legend hm-fatigue" aria-label="Escala de fatiga">
      <span>Fatigado</span>
      <div className="hm-c l4" />
      <span className="ml-1.5">Recuperando</span>
      <div className="hm-c l2" />
      <span className="ml-1.5">Listo</span>
      <div className="hm-c l0" />
    </div>
  )
}

export function StrengthLegend() {
  return (
    <div className="hm-legend hm-strength" aria-label="Fuerza retenida">
      <span>
        100% <span className="opacity-65">plena</span>
      </span>
      <div className="hm-c l4" />
      <div className="hm-c l3" />
      <div className="hm-c l2" />
      <div className="hm-c l1" />
      <div className="hm-c l0" />
      <span>
        {Math.round(STRENGTH_FLOOR * 100)}%{' '}
        <span className="opacity-65">base</span>
      </span>
    </div>
  )
}

export function BodyMap({
  gender,
  sex,
  body,
  view = 'both',
  mode = 'volume',
  load = {},
  thresholds,
  recovery = {},
  strength = {},
  painEntries = [],
  onSelectMuscle,
  onSelect,
  onMuscle,
  selectedMuscle,
  selected,
  interactive = true,
  bare = false,
  showLegend = true,
  className,
}: BodyMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)

  const resolvedGender = body || sex || gender || 'male'
  const resolvedSelected = selected ?? selectedMuscle ?? null
  const handlePick = (slug: MuscleSlug | PainZone) => {
    if (!interactive) return
    onSelectMuscle?.(slug)
    if (MUSCLES.includes(slug as MuscleSlug)) {
      onMuscle?.(slug as MuscleSlug)
      onSelect?.(slug as MuscleSlug)
    }
  }

  // Compute 0..4 shade levels exactly as Open-Gym's BodyMap.jsx
  const levels: Record<MuscleSlug, number> = (() => {
    if (mode === 'recovery') {
      const fatigueLoad: Partial<Record<MuscleSlug, number>> = {}
      for (const m of MUSCLES) {
        fatigueLoad[m] = recovery[m]?.fatigueScore ?? load[m] ?? 0
      }
      return levelsOf(fatigueLoad, thresholds ?? FATIGUE_LEVELS)
    }
    if (mode === 'strength') {
      const strengthLoad: Partial<Record<MuscleSlug, number>> = {}
      for (const m of MUSCLES) {
        strengthLoad[m] = strength[m] ?? load[m] ?? STRENGTH_FLOOR
      }
      return levelsOf(strengthLoad, thresholds ?? STRENGTH_LEVELS)
    }
    if (mode === 'clinical') {
      const clinicalLevels: Partial<Record<MuscleSlug, number>> = {}
      for (const m of MUSCLES) {
        const pain = painEntries.find((p) => p.zone === m)
        clinicalLevels[m] = !pain
          ? 0
          : pain.severity === 'severe'
            ? 4
            : pain.severity === 'moderate'
              ? 3
              : 2
      }
      return clinicalLevels as Record<MuscleSlug, number>
    }
    return levelsOf(load, thresholds)
  })()

  const modeClass =
    mode === 'recovery'
      ? 'hm-fatigue'
      : mode === 'strength'
        ? 'hm-strength'
        : mode === 'clinical'
          ? 'hm-clinical'
          : ''

  const renderView = (side: 'front' | 'back') => {
    const g = BODY_PATHS[resolvedGender] || BODY_PATHS.male
    const viewData = g[side]
    if (!viewData) return null

    const activateKey = (
      event: React.KeyboardEvent<SVGPathElement>,
      slug: MuscleSlug | PainZone,
    ) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (event.key === ' ') event.preventDefault()
      handlePick(slug)
    }

    return (
      <svg
        className="bm-v select-none"
        viewBox={viewData.vb}
        role={interactive ? 'group' : 'img'}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Inert silhouette (head, hair, neck, hands, feet, knees, ankles) — never shaded unless clinical pain on joint */}
        {INERT.map((slug) =>
          (viewData.p[slug] || []).map((d, i) => {
            const pain =
              mode === 'clinical'
                ? painEntries.find((p) => p.zone === slug)
                : null
            const painLevel = !pain
              ? 0
              : pain.severity === 'severe'
                ? 4
                : pain.severity === 'moderate'
                  ? 3
                  : 2
            const isSel = resolvedSelected === slug
            return (
              <path
                key={`${slug}-${i}`}
                className={cn(
                  'bm-sil',
                  painLevel > 0 && `l${painLevel} cursor-pointer`,
                  isSel && 'sel',
                )}
                d={d}
                onClick={
                  mode === 'clinical' && interactive
                    ? () => handlePick(slug as PainZone)
                    : undefined
                }
              />
            )
          }),
        )}

        {/* 2. Drawable canonical muscles (18 muscles) */}
        {MUSCLES.map((slug) =>
          (viewData.p[slug] || []).map((d, i) => {
            const lvl = levels[slug] || 0
            const isSel =
              resolvedSelected === slug || hoveredMuscle === slug
            const labelEs = MUSCLE_NAMES_ES[slug] || slug

            return (
              <path
                key={`${slug}-${i}`}
                className={cn(
                  `bm-m l${lvl}`,
                  isSel && 'sel',
                )}
                d={d}
                onPointerEnter={() => interactive && setHoveredMuscle(slug)}
                onPointerLeave={() => interactive && setHoveredMuscle(null)}
                onClick={interactive ? () => handlePick(slug) : undefined}
                onKeyDown={
                  interactive ? (e) => activateKey(e, slug) : undefined
                }
                role={interactive ? 'button' : undefined}
                tabIndex={interactive && i === 0 ? 0 : undefined}
                aria-label={interactive ? labelEs : undefined}
                aria-pressed={
                  interactive ? resolvedSelected === slug : undefined
                }
              >
                <title>{labelEs}</title>
              </path>
            )
          }),
        )}
      </svg>
    )
  }

  // Bare mode: renders just the Open-Gym `.bodymap` flex container (used inside MuscleBalanceCard / MuscleExplorer)
  if (bare) {
    return (
      <div
        className={cn(
          'bodymap',
          interactive && 'tappable',
          modeClass,
          className,
        )}
      >
        {(view === 'both' || view === 'front') && renderView('front')}
        {(view === 'both' || view === 'back') && renderView('back')}
      </div>
    )
  }

  const activeFocus = hoveredMuscle || resolvedSelected
  const activeFocusLabel = activeFocus
    ? MUSCLE_NAMES_ES[activeFocus as MuscleSlug] ||
      PAIN_ZONE_LABELS_ES[activeFocus as PainZone] ||
      activeFocus
    : null

  const activeFocusSets =
    activeFocus && mode === 'volume'
      ? Math.round((load[activeFocus as MuscleSlug] || 0) * 10) / 10
      : null

  const activeFocusRecovery =
    activeFocus && mode === 'recovery'
      ? recovery[activeFocus as MuscleSlug]
      : null

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-md shadow-sm',
        className,
      )}
    >
      {/* Header bar / Mode info */}
      <div className="flex w-full items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          {mode === 'volume' && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary font-bold text-[11px] gap-1"
            >
              <Flame className="size-3" />
              Mapa de Volumen
            </Badge>
          )}
          {mode === 'recovery' && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary font-bold text-[11px] gap-1"
            >
              <Activity className="size-3" />
              Fatiga & Recuperación
            </Badge>
          )}
          {mode === 'strength' && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary font-bold text-[11px] gap-1"
            >
              <Sparkles className="size-3" />
              Fuerza Retenida
            </Badge>
          )}
          {mode === 'clinical' && (
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 text-destructive font-bold text-[11px] gap-1"
            >
              <ShieldAlert className="size-3" />
              Mapa Clínico / Molestias
            </Badge>
          )}
        </div>

        {activeFocusLabel ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span>{activeFocusLabel}</span>
            {activeFocusSets != null && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-mono tabular-nums"
              >
                {activeFocusSets} series
              </Badge>
            )}
            {activeFocusRecovery && (
              <Badge
                variant="outline"
                className={cn(
                  'px-1.5 py-0 text-[10px] uppercase font-bold',
                  activeFocusRecovery.state === 'fatigued' &&
                    'bg-destructive/10 text-destructive border-destructive/30',
                  activeFocusRecovery.state === 'recovering' &&
                    'bg-primary/15 text-primary border-primary/30',
                  activeFocusRecovery.state === 'ready' &&
                    'bg-muted text-muted-foreground border-border',
                )}
              >
                {activeFocusRecovery.state === 'fatigued' && 'Fatigado'}
                {activeFocusRecovery.state === 'recovering' &&
                  `Recuperando (${activeFocusRecovery.hoursToReady}h)`}
                {activeFocusRecovery.state === 'ready' && 'Listo'}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Toca un músculo para inspeccionar
          </span>
        )}
      </div>

      {/* SVG Canvas Side-by-Side (Front & Back) */}
      <div
        className={cn(
          'bodymap py-3',
          interactive && 'tappable',
          modeClass,
        )}
      >
        {(view === 'both' || view === 'front') && renderView('front')}
        {(view === 'both' || view === 'back') && renderView('back')}
      </div>

      {/* Footer Legend */}
      {showLegend && (
        <div className="border-t border-border/40 pt-2">
          {mode === 'volume' && <BodyMapLegend />}
          {mode === 'recovery' && <FatigueLegend />}
          {mode === 'strength' && <StrengthLegend />}
          {mode === 'clinical' && (
            <div className="hm-legend hm-clinical">
              <span>Agudo</span>
              <div className="hm-c l4" style={{ background: 'var(--destructive)' }} />
              <span className="ml-1.5">Moderado</span>
              <div className="hm-c l3" style={{ background: 'oklch(0.70 0.19 48)' }} />
              <span className="ml-1.5">Leve</span>
              <div className="hm-c l2" style={{ background: 'var(--primary)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BodyMap
