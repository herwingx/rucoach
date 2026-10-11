import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function DayCardSkeleton({ rest = false }: { rest?: boolean }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border shadow-md transform transition-all',
        rest
          ? 'border-dashed border-muted-foreground/25 bg-muted/5'
          : 'border-border/50 bg-card/60 backdrop-blur-sm'
      )}
    >
      <div className="flex flex-col gap-5 px-6 pb-5 pt-6 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-36 sm:w-44 rounded-md" />
              <Skeleton className="h-3.5 w-full max-w-[18rem] rounded-md opacity-40 uppercase tracking-widest" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 px-4 py-2.5">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-md opacity-60" />
          </div>
        </div>
      </div>
      {!rest && (
        <div className="flex flex-col gap-4 px-6 pb-8 pt-0 sm:px-8">
          <Skeleton className="min-h-[80px] w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      )}
    </div>
  )
}

/**
 * Inner layout for routine builder (`RoutineBuilderClient`), shared by route `loading.tsx` and dynamic import fallback.
 */
export function RoutineBuilderContentSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-32 lg:pb-12"
      aria-busy="true"
      aria-label="Cargando constructor"
    >
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
           <Skeleton className="size-5 shrink-0 rounded-full mt-0.5 opacity-40" />
           <div className="space-y-2.5 flex-1">
             <Skeleton className="h-4 w-48 rounded-md" />
             <Skeleton className="h-3.5 w-full max-w-2xl rounded-md opacity-60" />
             <Skeleton className="h-3.5 w-full max-w-xl rounded-md opacity-60" />
           </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/50 shadow-sm ring-1 ring-primary/5 bg-card/60 backdrop-blur-sm">
        <div className="flex gap-4 px-5 pb-4 pt-6 sm:px-8 sm:pt-8 border-b bg-muted/5">
          <Skeleton className="size-11 sm:size-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-6 w-48 sm:h-7 max-w-full rounded-xl" />
            <Skeleton className="h-3.5 w-full max-w-md rounded-md opacity-40" />
          </div>
        </div>
        <div className="flex flex-col gap-6 px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="space-y-2.5 md:col-span-8">
              <Skeleton className="h-3.5 w-28 rounded-md opacity-40" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2.5 md:col-span-4">
              <Skeleton className="h-3.5 w-24 rounded-md opacity-40" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2.5 md:col-span-6">
              <Skeleton className="h-3.5 w-24 rounded-md opacity-40" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2.5 md:col-span-6">
              <Skeleton className="h-3.5 w-24 rounded-md opacity-40" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2.5 md:col-span-12">
              <Skeleton className="h-3.5 w-40 rounded-md opacity-40" />
              <Skeleton className="min-h-28 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
               <Skeleton className="size-2 rounded-full bg-primary animate-pulse" />
               <Skeleton className="h-6 w-52 sm:h-7 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-full max-w-md rounded-md opacity-60" />
          </div>
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>

        <Separator className="opacity-40" />

        <div className="flex flex-col gap-6">
          <DayCardSkeleton />
          <DayCardSkeleton rest />
          <DayCardSkeleton />
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/95',
          'px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-8',
          'lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none',
        )}
        aria-hidden
      >
        <div className="mx-auto w-full max-w-4xl lg:max-w-none">
          <Skeleton className="h-14 w-full rounded-2xl shadow-xl shadow-primary/10" />
        </div>
      </div>
    </div>
  )
}
