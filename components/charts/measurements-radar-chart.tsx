'use client'

import * as React from 'react'
import { crosshair, defineChart, dot, lineY } from '@tanstack/charts'
import {
  angleGrid,
  focusGroupAngle,
  polar,
  radialArea,
  radialDot,
  radialGrid,
  radialLine,
} from '@tanstack/charts/polar'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MeasurementRow } from './measurements-types'
import { parseRecordedDate } from '@/lib/calendar-date'
import {
  closedLinearCurve,
  monotoneXCurve,
  ruCoachChartTheme,
} from '@/components/charts/tanstack-chart-utils'

type Metric = 'balance' | 'weight' | 'waist' | 'fat'

const METRIC_META: Record<
  Exclude<Metric, 'balance'>,
  { label: string; unit: string; colorVar: string }
> = {
  weight: { label: 'Peso', unit: 'kg', colorVar: 'var(--chart-1)' },
  waist: { label: 'Cintura', unit: 'cm', colorVar: 'var(--chart-2)' },
  fat: { label: 'Grasa corporal', unit: '%', colorVar: 'var(--chart-3)' },
}

const BODY_KPI_DEFS: Array<{
  key: keyof MeasurementRow
  label: string
  unit: string
}> = [
  { key: 'weight', label: 'Peso', unit: 'kg' },
  { key: 'waist_cm', label: 'Cintura', unit: 'cm' },
  { key: 'body_fat_pct', label: '% Grasa', unit: '%' },
  { key: 'chest_cm', label: 'Pecho', unit: 'cm' },
  { key: 'hip_cm', label: 'Cadera', unit: 'cm' },
  { key: 'arm_cm', label: 'Brazo', unit: 'cm' },
  { key: 'thigh_cm', label: 'Muslo', unit: 'cm' },
]

type RadarDatum = {
  slot: string
  date: string
  fullDate: string
  value: number
  rawDisplay?: string
  initialDisplay?: string
}

export function MeasurementsRadarChart({
  measurements,
}: {
  measurements: MeasurementRow[]
}) {
  const chartIdPrefix = React.useId().replace(/:/g, '')

  const sortedMeasurements = React.useMemo(
    () =>
      [...(measurements || [])].sort(
        (a, b) =>
          parseRecordedDate(a.recorded_at).getTime() -
          parseRecordedDate(b.recorded_at).getTime(),
      ),
    [measurements],
  )

  const kpiRadarData = React.useMemo<RadarDatum[]>(() => {
    const items: RadarDatum[] = []
    for (const def of BODY_KPI_DEFS) {
      let firstVal: number | null = null
      let latestVal: number | null = null
      for (const m of sortedMeasurements) {
        const raw = m[def.key]
        const n = raw !== null && raw !== undefined ? Number(raw) : Number.NaN
        if (Number.isFinite(n) && n > 0) {
          if (firstVal === null) firstVal = n
          latestVal = n
        }
      }
      if (firstVal !== null && latestVal !== null) {
        const normalizedPct = Math.round((latestVal / firstVal) * 1000) / 10
        items.push({
          slot: `kpi-${String(def.key)}`,
          date: def.label,
          fullDate: def.label,
          value: normalizedPct,
          rawDisplay: `${latestVal} ${def.unit}`,
          initialDisplay: `${firstVal} ${def.unit}`,
        })
      }
    }
    return items
  }, [sortedMeasurements])

  const hasMultiKpi = kpiRadarData.length >= 3
  const [metric, setMetric] = React.useState<Metric>(() =>
    hasMultiKpi ? 'balance' : 'weight',
  )

  React.useEffect(() => {
    if (hasMultiKpi && metric === 'weight') {
      setMetric('balance')
    } else if (!hasMultiKpi && metric === 'balance') {
      setMetric('weight')
    }
  }, [hasMultiKpi])

  const activeMetricKey: Exclude<Metric, 'balance'> =
    metric === 'balance' ? 'weight' : metric
  const meta = METRIC_META[activeMetricKey]

  const chartData = React.useMemo<RadarDatum[]>(() => {
    if (metric === 'balance' && hasMultiKpi) {
      return kpiRadarData
    }

    const extract = (m: MeasurementRow) => {
      if (activeMetricKey === 'weight') return m.weight
      if (activeMetricKey === 'waist') return m.waist_cm
      return m.body_fat_pct
    }

    const valid = sortedMeasurements.filter((m) => {
      const v = extract(m)
      return typeof v === 'number' && Number.isFinite(v)
    })
    const last = valid.slice(-6)

    const seenLabels = new Map<string, number>()
    return last.map((m, idx) => {
      const d = parseRecordedDate(m.recorded_at)
      const baseLabel = format(d, 'dd MMM', { locale: es })
      const count = (seenLabels.get(baseLabel) ?? 0) + 1
      seenLabels.set(baseLabel, count)
      const label = count > 1 ? `${baseLabel} (${count})` : baseLabel
      return {
        slot: `rad-${idx}`,
        date: label,
        fullDate: format(d, "d 'de' MMMM yyyy", { locale: es }),
        value: Number(extract(m)),
      }
    })
  }, [
    metric,
    hasMultiKpi,
    kpiRadarData,
    sortedMeasurements,
    activeMetricKey,
  ])

  const cartesianDefinition = React.useMemo(() => {
    const values = chartData.map((d) => d.value)
    const minVal = values.length > 0 ? Math.min(...values) : 0
    const maxVal = values.length > 0 ? Math.max(...values) : 100
    const pad = Math.max(1, (maxVal - minVal) * 0.25)

    return defineChart({
      marks: [
        lineY(chartData, {
          x: 'date',
          y: 'value',
          key: 'slot',
          curve: monotoneXCurve,
          stroke: meta.colorVar,
          strokeWidth: 2.5,
        }),
        dot(chartData, {
          x: 'date',
          y: 'value',
          key: 'slot',
          r: 4.5,
          fill: meta.colorVar,
          stroke: 'var(--background)',
          strokeWidth: 1.5,
        }),
        crosshair({
          x: true,
          y: false,
          stroke: meta.colorVar,
          strokeOpacity: 0.35,
          strokeDasharray: '4 4',
        }),
      ],
      scales: {
        x: {
          scale: () => scalePoint<string>().padding(0.35),
          axis: {
            line: false,
            ticks: { line: false, padding: 8 },
            tickLabels: { fontSize: 11 },
          },
        },
        y: {
          scale: scaleLinear().domain([
            Math.max(0, minVal - pad),
            maxVal + pad,
          ]),
          nice: true,
          grid: {
            strokeDasharray: '3 3',
            strokeOpacity: 0.45,
          },
          axis: false,
        },
      },
      margin: { top: 16, right: 20, bottom: 28, left: 20 },
      theme: ruCoachChartTheme,
      focus: 'nearest-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      svgAnimation: true,
      tooltip: {
        use: tooltip,
        content: (pts) => {
          const pt = pts[0]
          const d = pt?.datum
          return {
            title: d?.fullDate ?? d?.date ?? '',
            rows: [
              {
                label: meta.label,
                value: `${d?.value ?? '—'} ${meta.unit}`,
                color: meta.colorVar,
                active: true,
              },
            ],
          }
        },
      },
    })
  }, [chartData, meta.colorVar, meta.label, meta.unit])

  const polarDefinition = React.useMemo(() => {
    const values = chartData.map((d) => d.value)
    const maxVal = values.length > 0 ? Math.max(...values) : 100
    const domainMax =
      metric === 'balance'
        ? Math.max(120, maxVal + 15)
        : Math.max(10, Math.ceil(maxVal * 1.15))
    const activeColor =
      metric === 'balance' ? 'var(--primary)' : meta.colorVar

    return defineChart({
      marks: [
        polar({
          radiusRatio: 0.72,
          inset: 10,
          scales: {
            angle: {
              scale: scalePoint<string>().domain(chartData.map((d) => d.date)),
              wrap: true,
            },
            radius: {
              scale: scaleLinear().domain([0, domainMax]),
              nice: true,
            },
          },
          guides: [
            radialGrid({
              ticks: 4,
              shape: 'polygon',
              stroke: 'var(--border)',
              strokeOpacity: 0.65,
            }),
            angleGrid({
              labels: true,
              labelOffset: 14,
              labelFontSize: 11,
              labelFill: 'var(--muted-foreground)',
              stroke: 'var(--border)',
              strokeOpacity: 0.55,
            }),
          ],
          marks: [
            radialArea(chartData, {
              angle: 'date',
              radius: 'value',
              key: 'slot',
              curve: closedLinearCurve,
              fill: activeColor,
              fillOpacity: 0.28,
            }),
            radialLine(chartData, {
              angle: 'date',
              radius: 'value',
              key: 'slot',
              curve: closedLinearCurve,
              stroke: activeColor,
              strokeWidth: 2.25,
            }),
            radialDot(chartData, {
              angle: 'date',
              radius: 'value',
              key: 'slot',
              r: 4,
              fill: activeColor,
              stroke: 'var(--background)',
              strokeWidth: 1.5,
            }),
          ],
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
      margin: { top: 18, right: 24, bottom: 18, left: 24 },
      theme: ruCoachChartTheme,
      focus: focusGroupAngle,
      maxFocusDistance: Number.POSITIVE_INFINITY,
      svgAnimation: true,
      tooltip: {
        use: tooltip,
        content: (pts) => {
          const pt = pts[0]
          const d = pt?.datum as RadarDatum | undefined
          if (metric === 'balance' && d?.rawDisplay) {
            const rows = [
              {
                label: 'Actual',
                value: d.rawDisplay,
                color: 'var(--primary)',
                active: true,
              },
            ]
            if (d.initialDisplay && d.initialDisplay !== d.rawDisplay) {
              rows.push({
                label: 'Inicial',
                value: `${d.initialDisplay} (${d.value}%)`,
                color: 'var(--muted-foreground)',
                active: false,
              })
            }
            return {
              title: d.fullDate,
              rows,
            }
          }
          return {
            title: d?.fullDate ?? d?.date ?? '',
            rows: [
              {
                label: meta.label,
                value: `${d?.value ?? '—'} ${meta.unit}`,
                color: meta.colorVar,
                active: true,
              },
            ],
          }
        },
      },
    })
  }, [chartData, meta.colorVar, meta.label, meta.unit, metric])

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-center">
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList
            className={`grid h-9 w-full max-w-[340px] rounded-full p-1 bg-muted/50 border border-border/50 ${
              hasMultiKpi ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {hasMultiKpi && (
              <TabsTrigger value="balance" className="rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                Balance
              </TabsTrigger>
            )}
            <TabsTrigger value="weight" className="rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
              Peso
            </TabsTrigger>
            <TabsTrigger value="waist" className="rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
              Cintura
            </TabsTrigger>
            <TabsTrigger value="fat" className="rounded-full text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
              % Grasa
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
          Sin datos suficientes para {meta.label.toLowerCase()}.
        </div>
      ) : chartData.length < 3 ? (
        <Chart
          definition={cartesianDefinition}
          height={230}
          idPrefix={`radar-line-${chartIdPrefix}`}
          ariaLabel={`Gráfica lineal de ${meta.label}`}
          className="w-full"
        />
      ) : (
        <Chart
          definition={polarDefinition}
          height={250}
          idPrefix={`radar-polar-${chartIdPrefix}`}
          ariaLabel={
            metric === 'balance'
              ? 'Gráfica radar de composición corporal'
              : `Gráfica radar de ${meta.label}`
          }
          className="w-full"
        />
      )}
    </div>
  )
}
