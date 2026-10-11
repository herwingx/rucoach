import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientStackPageHeaderSkeleton } from "@/components/client/client-data-pages-skeleton";
import { CLIENT_DATA_PAGE_SHELL } from "@/components/client/client-app-page-parts";

export default function AchievementsLoading() {
  return (
    <>
      <ClientStackPageHeaderSkeleton />
      <div
        className={CLIENT_DATA_PAGE_SHELL}
        aria-busy="true"
        aria-label="Cargando logros"
      >
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4" aria-hidden>
            <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/60 shadow-sm ring-1 ring-primary/5">
              <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-64 max-w-full" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-52 max-w-full" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card
                      key={i}
                      className="rounded-2xl border-border/60 bg-muted/15 shadow-none"
                    >
                      <CardHeader className="flex flex-row items-start gap-3 p-4 pb-2">
                        <Skeleton className="size-9 shrink-0 rounded-xl" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Skeleton className="mb-1 h-8 w-16" />
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="mt-2 h-3 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-4" aria-hidden>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="rounded-3xl border-border/80 bg-card/60 shadow-sm ring-1 ring-primary/5"
                >
                  <CardContent className="flex flex-col items-center gap-4 p-6">
                    <Skeleton className="size-16 rounded-2xl" />
                    <Skeleton className="h-4 w-full max-w-48" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2 overflow-hidden pb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card
                  key={i}
                  className="rounded-3xl border-border/80 bg-card/60 shadow-sm ring-1 ring-primary/5"
                >
                  <CardHeader className="flex flex-row gap-4 pb-2">
                    <Skeleton className="size-14 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

