'use client'

import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Flame,
  LayoutGrid,
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { AdminKpiStatCard } from '@/components/admin/admin-kpi-stat-card'

export type AdminDashboardMetrics = {
  totalTrainingsThisWeek: number
  prsThisMonth: number
  prsLastMonth?: number
  mostActiveClientId: string | null
  mostActiveClientName: string | null
  attentionClientId: string | null
  attentionClientName: string | null
  attentionReason?: string | null
  totalClients: number
  activeThisWeekCount: number
  attentionCount: number
  trainingsLastWeek?: number
}

/** Tendencia entre dos periodos. Si el periodo anterior es 0, no se inventa un "+100%" (sería engañoso). */
type PeriodTrend =
  | { kind: 'none' }
  | { kind: 'no_baseline' }
  | { kind: 'pct'; value: number }

function periodTrend(current: number, previous: number): PeriodTrend {
  if (previous === 0) {
    if (current === 0) return { kind: 'none' }
    return { kind: 'no_baseline' }
  }
  return { kind: 'pct', value: Math.round(((current - previous) / previous) * 100) }
}

function TrendPctBadge({ trend }: { trend: Exclude<PeriodTrend, { kind: 'none' }> }) {
  if (trend.kind === 'no_baseline') {
    return (
      <Badge
        variant="outline"
        title="El periodo anterior tenía 0; no hay porcentaje de cambio significativo."
        className="max-w-[11rem] truncate border-muted-foreground/30 text-[10px] font-medium text-muted-foreground tabular-nums"
      >
        Sin base previa
      </Badge>
    )
  }
  const pct = trend.value
  return (
    <Badge
      variant="outline"
      className={cn(
        'tabular-nums text-[10px] font-semibold uppercase tracking-wide border-none',
        pct >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
      )}
    >
      {pct >= 0 ? <TrendingUp className="mr-1 inline size-3 align-middle" /> : <TrendingDown className="mr-1 inline size-3 align-middle" />}
      {pct >= 0 ? '+' : ''}
      {pct}%
    </Badge>
  )
}

export function AdminDashboardCards({
  totalTrainingsThisWeek,
  prsThisMonth,
  prsLastMonth = 0,
  mostActiveClientId,
  mostActiveClientName,
  attentionClientId,
  attentionClientName,
  attentionReason,
  totalClients,
  activeThisWeekCount,
  attentionCount,
  trainingsLastWeek = 0,
}: AdminDashboardMetrics) {
  const weekTrend = periodTrend(totalTrainingsThisWeek, trainingsLastWeek)
  const prMonthTrend = periodTrend(prsThisMonth, prsLastMonth)
  const activePct =
    totalClients > 0 ? Math.round((activeThisWeekCount / totalClients) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminKpiStatCard
          icon={Users}
          value={totalClients}
          label="Asesorados"
          badge={
            <Badge variant="outline" className="tabular-nums text-[10px] font-semibold uppercase tracking-wide">
              Cartera
            </Badge>
          }
        />

        <AdminKpiStatCard
          icon={Activity}
          value={totalTrainingsThisWeek}
          label="Sesiones esta semana"
          badge={weekTrend.kind !== 'none' ? <TrendPctBadge trend={weekTrend} /> : null}
        />

        <AdminKpiStatCard
          icon={Trophy}
          value={prsThisMonth}
          label="PRs este mes"
          description="Tu cartera: eventos PR + series marcadas en entrenos"
          badge={prMonthTrend.kind !== 'none' ? <TrendPctBadge trend={prMonthTrend} /> : null}
        />

        <AdminKpiStatCard
          icon={LayoutGrid}
          value={activeThisWeekCount}
          label="Activos (7 días)"
          badge={
            <Badge variant="secondary" className="tabular-nums text-[10px] font-semibold">
              {activePct}%
            </Badge>
          }
        />
      </div>

      <Card className="overflow-hidden py-0 gap-0 rounded-2xl border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-4 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-bold tracking-tight">Seguimiento</CardTitle>
            {attentionCount > 0 ? (
              <Badge variant="destructive" className="gap-1 font-semibold">
                <AlertTriangle className="size-3.5" />
                {attentionCount} prioritaria{attentionCount !== 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="font-medium text-muted-foreground">
                Sin alertas críticas
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Basado en sesiones reales, rutina asignada y estado del plan — no son estimaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Flame className="size-3.5 text-primary" />
                Mayor constancia (30 días)
              </div>
              <p className="truncate text-lg font-bold leading-tight">
                {mostActiveClientName || '—'}
              </p>
              {mostActiveClientId ? (
                <Button variant="outline" size="sm" className="w-full sm:w-fit rounded-xl font-semibold" asChild>
                  <Link href={`/admin/clients/${mostActiveClientId}`}>Ver perfil</Link>
                </Button>
              ) : null}
            </div>
            <Separator className="sm:hidden" />
            <div className="border-t border-border/40 bg-muted/15 sm:border-t-0 sm:border-l">
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-destructive" />
                  Revisar primero
                </div>
                {attentionClientName ? (
                  <>
                    <p className="truncate text-lg font-bold leading-tight text-destructive">
                      {attentionClientName}
                    </p>
                    <p className="text-sm text-muted-foreground">{attentionReason || 'Requiere acción'}</p>
                    {attentionClientId ? (
                      <Button size="sm" className="w-full sm:w-fit rounded-xl font-bold" asChild>
                        <Link href={`/admin/clients/${attentionClientId}`}>Abrir ficha</Link>
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay casos priorizados con la lógica actual. Filtra por &quot;Atención&quot; si quieres
                    revisar todos.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
