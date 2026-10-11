import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type AdminKpiStatTone = 'neutral' | 'primary' | 'success' | 'warning' | 'destructive'

const iconWell: Record<AdminKpiStatTone, string> = {
  neutral: 'border border-transparent bg-muted/50 text-foreground',
  primary: 'border border-primary/20 bg-primary/10 text-primary',
  success: 'border border-success/20 bg-success/10 text-success',
  warning: 'border border-warning/20 bg-warning/10 text-warning',
  destructive: 'border border-destructive/20 bg-destructive/10 text-destructive',
}

type AdminKpiStatCardProps = {
  icon: LucideIcon
  label: string
  value: ReactNode
  /** Secondary line (e.g. “Pagos completados”) */
  description?: string
  tone?: AdminKpiStatTone
  badge?: ReactNode
  className?: string
  valueClassName?: string
}

/**
 * KPI tile: neutral card surface; icon in a rounded well.
 * - Default `tone="neutral"` for counts, money, and operational metrics (payments, routines, sessions).
 * - Use semantic tones only when the tile represents a **status bucket** users scan quickly
 *   (e.g. activo / vencido / suspendido). If two screens need different meanings, use **different
 *   icons** — avoid reusing the same glyph (e.g. Clock) with conflicting tones across views.
 */
export function AdminKpiStatCard({
  icon: Icon,
  label,
  value,
  description,
  tone = 'neutral',
  badge,
  className,
  valueClassName,
}: AdminKpiStatCardProps) {
  return (
    <Card
      className={cn(
        'py-0 gap-0 min-w-0 overflow-visible rounded-2xl border-border/50 bg-card/60 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start gap-3 p-4 pb-2">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4 [&_svg]:shrink-0',
            iconWell[tone],
          )}
          aria-hidden
        >
          <Icon />
        </div>
        {badge ? <div className="min-w-0 flex-1 text-right">{badge}</div> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-4 pt-0">
        <p
          className={cn(
            'text-2xl font-bold tabular-nums tracking-tight sm:text-3xl',
            valueClassName,
          )}
        >
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground/90">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
