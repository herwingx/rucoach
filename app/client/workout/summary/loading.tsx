import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIENT_DATA_PAGE_SHELL } from "@/components/client/client-app-page-parts";
import { ClientStackPageHeaderSkeleton } from "@/components/client/client-data-pages-skeleton";

/** Alineado con `WorkoutSummaryClient`: main 7 · aside 5 sticky (métricas + progresión). */
export default function Loading() {
  return (
    <>
      <ClientStackPageHeaderSkeleton />
      <div
        className={CLIENT_DATA_PAGE_SHELL}
        aria-busy="true"
        aria-label="Cargando resumen"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <section className="flex flex-col gap-6 lg:col-span-7">
            <Card className="overflow-hidden rounded-3xl border-border/80 shadow-sm ring-1 ring-primary/5">
              <CardHeader className="pb-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-7 w-[min(100%,18rem)]" />
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-3 border-y border-border/60 py-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-7 w-12" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="min-h-24 w-full rounded-md" />
                  <Skeleton className="h-9 w-full max-w-xs rounded-md" />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 flex-1 rounded-lg" />
              <Skeleton className="h-11 flex-1 rounded-lg" />
            </div>
          </section>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(112px+1.5rem)] lg:col-span-5 lg:self-start">
            <Card className="overflow-hidden rounded-3xl border-border/80 shadow-sm ring-1 ring-primary/5">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="mt-1 h-3 w-full max-w-xs" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="mt-2 h-3 w-full max-w-sm" />
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-border/80 shadow-sm ring-1 ring-primary/5">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-3 w-full max-w-sm" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full max-w-xs" />
                  </div>
                  <Skeleton className="h-6 w-10 shrink-0 rounded-full" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
