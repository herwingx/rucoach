'use client'

import * as React from 'react'
import { areaY, crosshair, defineChart, dot, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, Calendar, History, Ruler, Scale } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MeasurementRow } from './measurements-types'
import {
  createAreaGradient,
  monotoneXCurve,
  ruCoachChartTheme,
} from '@/components/charts/tanstack-chart-utils'

export type { MeasurementRow }

type Metric = 'weight' | 'waist' | 'fat'
type ViewMode = 'raw' | 'monthly'

const METRIC_META: Record<
  Metric,
  {
    label: string
    unit: string
    color: string
    icon: typeof Scale
  }
> = {
  weight: {
    label: 'Peso',
    unit: 'kg',
    color: 'var(--chart-1)',
    icon: Scale,
  },
  waist: {
    label: 'Cintura',
    unit: 'cm',
    color: 'var(--chart-2)',
    icon: Ruler,
  },
  fat: {
    label: '% Grasa',
    unit: '%',
    color: 'var(--chart-3)',
    icon: Activity,
  },
}

type ChartRow = {
  slot: string
  label: string
  value: number
  count?: number
  fullDate?: string
}

function extractMetric(row: MeasurementRow, metric: Metric): number | null {
  const raw =
    metric === 'weight'
      ? row.weight
      : metric === 'waist'
        ? row.waist_cm
        : row.body_fat_pct
  if (raw === null || raw === undefined) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseRecordedDate(dateStr: string): Date {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
}

export function MeasurementsChart({
  measurements,
}: {
  measurements: MeasurementRow[]
}) {
  const [metric, setMetric] = React.useState<Metric>('weight')
  const [viewMode, setViewMode] = React.useState<ViewMode>('raw')
  const chartIdPrefix = React.useId().replace(/:/g, '')

  const meta = METRIC_META[metric]

  const chartData = React.useMemo<ChartRow[]>(() => {
    const sorted = [...(measurements || [])].sort(
      (a, b) =>
        parseRecordedDate(a.recorded_at).getTime() -
        parseRecordedDate(b.recorded_at).getTime(),
    )

    if (viewMode === 'raw') {
      return sorted
        .map((m, idx) => {
          const val = extractMetric(m, metric)
          if (val === null) return null
          const d = parseRecordedDate(m.recorded_at)
          return {
            slot: `raw-${idx}`,
            label: format(d, 'dd MMM', { locale: es }),
            fullDate: format(d, "d 'de' MMMM yyyy", { locale: es }),
            value: val,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    }

    const buckets = new Map<string, { sum: number; n: number }>()
    for (const m of sorted) {
      const val = extractMetric(m, metric)
      if (val === null) continue
      const d = parseRecordedDate(m.recorded_at)
      const ym = format(d, 'yyyy-MM')
      const cur = buckets.get(ym) ?? { sum: 0, n: 0 }
      cur.sum += val
      cur.n += 1
      buckets.set(ym, cur)
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, { sum, n }], idx) => {
        const [y, m] = ym.split('-').map(Number)
        const d = new Date(y, (m || 1) - 1, 1)
        return {
          slot: `m-${idx}-${ym}`,
          label: format(d, 'MMM yy', { locale: es }),
          fullDate: format(d, 'MMMM yyyy', { locale: es }),
          value: Math.round((sum / n) * 10) / 10,
          count: n,
        }
      })
  }, [measurements, metric, viewMode])

  const labelBySlot = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const row of chartData) map.set(row.slot, row.label)
    return map
  }, [chartData])

  const definition = React.useMemo(() => {
    const values = chartData.map((d) => d.value)
    const minVal = values.length > 0 ? Math.min(...values) : 0
    const maxVal = values.length > 0 ? Math.max(...values) : 100
    const pad = Math.max(1, (maxVal - minVal) * 0.2)
    const lowerBound = Math.max(0, Math.floor((minVal - pad) * 10) / 10)
    const upperBound = Math.ceil((maxVal + pad) * 10) / 10

    return defineChart({
      marks: [
        areaY(chartData, {
          x: 'slot',
          y2: 'value',
          y1: lowerBound,
          key: 'slot',
          curve: monotoneXCurve,
          fill: 'url(#meas-area-grad)',
          fillOpacity: 1,
        }),
        lineY(chartData, {
          x: 'slot',
          y: 'value',
          key: 'slot',
          curve: monotoneXCurve,
          stroke: meta.color,
          strokeWidth: 2.5,
        }),
        dot(chartData, {
          x: 'slot',
          y: 'value',
          key: 'slot',
          r: 4,
          fill: meta.color,
          stroke: 'var(--background)',
          strokeWidth: 1.5,
        }),
        crosshair({
          x: true,
          y: false,
          stroke: meta.color,
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
              format: (v) =>
                `${Number(v).toFixed(meta.unit === '%' ? 1 : 0)}${meta.unit}`,
            },
            tickLabels: { fontSize: 11 },
          },
        },
      },
      gradients: [
        createAreaGradient('meas-area-grad', meta.color, 0.38, 0.02),
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
              label: meta.label,
              value: `${d?.value ?? '—'} ${meta.unit}`,
              color: meta.color,
              active: true,
            },
          ]
          if (viewMode === 'monthly' && d?.count && d.count > 1) {
            rows.push({
              label: 'Promedio de',
              value: `${d.count} mediciones`,
              color: 'var(--muted-foreground)',
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
  }, [chartData, labelBySlot, meta.color, meta.label, meta.unit, viewMode])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        <Tabs
          value={metric}
          onValueChange={(v) => setMetric(v as Metric)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid h-9 w-full grid-cols-3 rounded-xl p-1 sm:w-[270px]">
            {(Object.keys(METRIC_META) as Metric[]).map((key) => {
              const Icon = METRIC_META[key].icon
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="gap-1.5 rounded-lg text-xs"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {METRIC_META[key].label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl p-1 sm:w-[200px]">
            <TabsTrigger value="raw" className="gap-1.5 rounded-lg text-xs">
              <History className="h-3.5 w-3.5 shrink-0" />
              Registros
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1.5 rounded-lg text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Mensual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
          Sin datos registrados para {meta.label.toLowerCase()}.
        </div>
      ) : (
        <Chart
          definition={definition}
          height={240}
          idPrefix={`meas-${chartIdPrefix}`}
          ariaLabel={`Gráfica de evolución de ${meta.label}`}
          className="w-full"
        />
      )}
    </div>
  )
}
