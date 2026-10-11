import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors `app/receptionist/dashboard/page.tsx` inside `app/receptionist/layout.tsx`
 * (which already provides the top navigation header and `<main className="container max-w-6xl">`).
 */
export function ReceptionistDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando panel de recepción">
      <div className="space-y-2">
        <Skeleton className="h-8 sm:h-9 w-56 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-lg rounded-md opacity-60" />
      </div>

      {/* Stats grid - 2 cols on mobile, 4 cols on lg */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="py-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-sm"
          >
            <CardHeader className="px-3.5 sm:px-5 py-3 border-b border-border/50 bg-muted/30">
              <Skeleton className="h-3.5 w-24 rounded-md opacity-60" />
            </CardHeader>
            <CardContent className="px-3.5 sm:px-5 py-4 space-y-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3 w-28 max-w-full rounded-md opacity-50" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card className="border-border/50 shadow-sm bg-muted/20 rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-44 rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

