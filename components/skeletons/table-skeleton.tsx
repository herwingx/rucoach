import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  showHeader?: boolean
}

export function TableSkeleton({ rows = 8, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="rounded-3xl border border-border/50 overflow-hidden bg-card/60 backdrop-blur-sm shadow-sm ring-1 ring-primary/5">
      {showHeader && (
        <div className="border-b border-border/30 bg-muted/5 p-4 sm:p-6 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-36 sm:w-44 rounded-md" />
          <Skeleton className="h-9 sm:h-10 w-24 sm:w-28 rounded-xl shrink-0" />
        </div>
      )}
      <div className="divide-y divide-border/30">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 hover:bg-muted/5 transition-colors">
            <Skeleton className="h-4 w-32 sm:w-48 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-full flex-1 min-w-0 rounded-md opacity-60" />
            <Skeleton className="hidden md:block h-4 w-28 shrink-0 rounded-md" />
            <Skeleton className="hidden sm:block h-6 w-20 rounded-full shrink-0" />
            <Skeleton className="hidden lg:block h-4 w-20 shrink-0 rounded-md opacity-40" />
            <Skeleton className="size-9 rounded-xl shrink-0 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

