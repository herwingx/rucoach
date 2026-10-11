import { Skeleton } from "@/components/ui/skeleton";
import { ClientStackPageHeaderSkeleton } from "@/components/client/client-data-pages-skeleton";

/** Alineado con `WorkoutActiveSession`: cabecera con timer + Terminar, grid lg 5+7, carrusel, hero, tabla de series. */
export default function WorkoutStartLoading() {
  return (
    <div
      className="flex min-h-dvh flex-col bg-background"
      aria-busy="true"
      aria-label="Cargando entreno"
    >
      <ClientStackPageHeaderSkeleton />

      {/* Progress Bar Skeleton */}
      <div className="relative h-1.5 w-full bg-muted/30">
        <Skeleton className="h-full w-1/4 rounded-none" />
      </div>

      <div className="container mx-auto flex-1 max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* Left Column: Exercises/Carousel */}
          <div className="flex flex-col gap-6 lg:col-span-5 lg:sticky lg:top-[calc(112px+1.5rem)] lg:self-start">
            <div className="flex items-center justify-between gap-2 px-1">
              <Skeleton className="size-11 shrink-0 rounded-xl" />
              <Skeleton className="h-3 w-40 rounded-md opacity-40 uppercase tracking-widest" />
              <Skeleton className="size-11 shrink-0 rounded-xl" />
            </div>

            <div className="-mx-1 flex gap-4 overflow-hidden px-1 pb-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex shrink-0 flex-col items-center gap-2"
                >
                  <Skeleton className="size-16 rounded-[1.2rem] sm:size-20" />
                  <Skeleton className="h-2 w-8 rounded-full opacity-40" />
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/80 shadow-md bg-card/60 backdrop-blur-sm">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="flex items-center justify-between gap-2 p-6 border-t border-border/40">
                <div className="space-y-1.5">
                   <Skeleton className="h-5 w-32 rounded-md" />
                   <Skeleton className="h-3 w-24 rounded-md opacity-60" />
                </div>
                <Skeleton className="size-10 rounded-xl" />
              </div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card/40 p-6">
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>

          {/* Right Column: Sets Table */}
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:self-start lg:pt-1">
            <div className="space-y-2.5">
              <Skeleton className="h-9 w-3/4 rounded-xl" />
              <Skeleton className="h-4 w-48 rounded-md opacity-60" />
            </div>

            <Skeleton className="h-4 w-full max-w-xl rounded-md opacity-40 uppercase tracking-widest" aria-hidden />

            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/60 p-6">
                   <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="size-6 rounded-full" />
                   </div>
                   <div className="grid grid-cols-3 gap-6">
                      <Skeleton className="h-14 w-full rounded-2xl" />
                      <Skeleton className="h-14 w-full rounded-2xl" />
                      <Skeleton className="h-14 w-full rounded-2xl" />
                   </div>
                </div>
              ))}
            </div>

            <Skeleton className="h-14 w-full rounded-2xl mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
