'use client'

import * as React from 'react'
import { areaY, crosshair, defineChart, dot, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dumbbell } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createAreaGradient,
  monotoneXCurve,
  ruCoachChartTheme,
} from '@/components/charts/tanstack-chart-utils'

export type ExercisePoint = {
  achieved_at: string
  weight_kg: number
  reps?: number | null
}

export type ExerciseLogPoint = ExercisePoint

export type ExerciseOption = {
  id: string
  name: string
  muscle_group?: string | null
}

type ExerciseChartDatum = {
  slot: string
  label: string
  weight_kg: number
  reps: number | null
  fullDate: string
}

export function ExerciseProgressChart({
  exercises,
  pointsByExerciseId,
  defaultExerciseId,
}: {
  exercises: ExerciseOption[]
  pointsByExerciseId: Record<string, ExercisePoint[]>
  defaultExerciseId?: string | null
}) {
  const chartIdPrefix = React.useId().replace(/:/g, '')
  const [selectedId, setSelectedId] = React.useState<string | null>(
    defaultExerciseId || exercises[0]?.id || null,
  )

  React.useEffect(() => {
    if (
      selectedId &&
      !exercises.some((e) => e.id === selectedId) &&
      exercises[0]?.id
    ) {
      setSelectedId(exercises[0].id)
    }
  }, [exercises, selectedId])

  const chartData = React.useMemo<ExerciseChartDatum[]>(() => {
    if (!selectedId) return []
    const pts = pointsByExerciseId[selectedId] || []
    return [...pts]
      .sort(
        (a, b) =>
          new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime(),
      )
      .map((p, idx) => {
        const d = new Date(p.achieved_at)
        return {
          slot: `ex-${idx}`,
          label: format(d, 'dd MMM', { locale: es }),
          weight_kg: p.weight_kg,
          reps: p.reps ?? null,
          fullDate: format(d, "d 'de' MMMM yyyy", { locale: es }),
        }
      })
  }, [pointsByExerciseId, selectedId])

  const selectedName =
    exercises.find((e) => e.id === selectedId)?.name || 'Ejercicio'

  const labelBySlot = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const row of chartData) map.set(row.slot, row.label)
    return map
  }, [chartData])

  const definition = React.useMemo(() => {
    const weights = chartData.map((d) => d.weight_kg)
    const minW = weights.length > 0 ? Math.min(...weights) : 0
    const maxW = weights.length > 0 ? Math.max(...weights) : 50
    const lowerBound = Math.max(0, Math.floor(minW * 0.85))
    const upperBound = Math.max(lowerBound + 10, Math.ceil(maxW * 1.08))

    return defineChart({
      marks: [
        areaY(chartData, {
          x: 'slot',
          y2: 'weight_kg',
          y1: lowerBound,
          key: 'slot',
          curve: monotoneXCurve,
          fill: 'url(#exercise-prog-grad)',
          fillOpacity: 1,
        }),
        lineY(chartData, {
          x: 'slot',
          y: 'weight_kg',
          key: 'slot',
          curve: monotoneXCurve,
          stroke: 'var(--chart-2)',
          strokeWidth: 2.5,
        }),
        dot(chartData, {
          x: 'slot',
          y: 'weight_kg',
          key: 'slot',
          r: 4,
          fill: 'var(--chart-2)',
          stroke: 'var(--background)',
          strokeWidth: 1.5,
        }),
        crosshair({
          x: true,
          y: false,
          stroke: 'var(--chart-2)',
          strokeOpacity: 0.35,
          strokeDasharray: '4 4',
        }),
      ],
      scales: {
        x: {
          scale: () => scalePoint<string>().padding(0.25),
          axis: {
            line: false,
            ticks: {
              line: false,
              padding: 8,
              format: (val) => labelBySlot.get(String(val)) ?? String(val),
            },
            tickLabels: {
              fontSize: 11,
              thin: { minGap: 28 },
            },
          },
        },
        y: {
          scale: scaleLinear().domain([lowerBound, upperBound]),
          nice: true,
          grid: {
            strokeDasharray: '3 3',
            strokeOpacity: 0.45,
          },
          axis: {
            line: false,
            ticks: {
              line: false,
              count: 4,
              format: (v) => `${Math.round(Number(v))}kg`,
            },
            tickLabels: { fontSize: 11 },
          },
        },
      },
      gradients: [
        createAreaGradient('exercise-prog-grad', 'var(--chart-2)', 0.38, 0.02),
      ],
      margin: { top: 12, right: 14, bottom: 28, left: 42 },
      theme: ruCoachChartTheme,
      focus: 'nearest-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      svgAnimation: true,
      tooltip: {
        use: tooltip,
        content: (pts) => {
          const pt = pts[0]
          const d = pt?.datum
          const rows = [
            {
              label: 'Peso máx.',
              value: `${d?.weight_kg ?? 0} kg`,
              color: 'var(--chart-2)',
              active: true,
            },
          ]
          if (d?.reps != null) {
            rows.push({
              label: 'Repeticiones',
              value: `${d.reps} reps`,
              color: 'var(--primary)',
              active: false,
            })
          }
          return {
            title: d?.fullDate ?? d?.label ?? '',
            rows,
          }
        },
      },
    })
  }, [chartData, labelBySlot])

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/40">
          <Dumbbell className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Sin datos de ejercicios aún
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Registra peso en tus entrenamientos para ver tu progresión por
          ejercicio.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Ejercicio:{' '}
          <span className="font-bold text-foreground">{selectedName}</span>
        </p>
        <Select
          value={selectedId || undefined}
          onValueChange={(v) => setSelectedId(v)}
        >
          <SelectTrigger
            className="w-full rounded-xl sm:w-[240px]"
            aria-label="Seleccionar ejercicio"
          >
            <SelectValue placeholder="Selecciona un ejercicio" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectGroup>
              {exercises.map((ex) => (
                <SelectItem key={ex.id} value={ex.id} className="rounded-lg">
                  {ex.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
          Sin registros para este ejercicio.
        </div>
      ) : (
        <Chart
          definition={definition}
          height={250}
          idPrefix={`ex-prog-${chartIdPrefix}`}
          ariaLabel={`Gráfica de progreso de fuerza para ${selectedName}`}
          className="w-full"
        />
      )}
    </div>
  )
}
