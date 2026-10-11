import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CLIENT_DATA_PAGE_SHELL } from '@/components/client/client-app-page-parts'

export function ClientStackPageHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl safe-area-header-pt min-h-[76px] sm:min-h-[112px] flex items-center" aria-hidden>
      <div className="container flex min-h-[76px] flex-col justify-center gap-3 py-3 sm:min-h-[112px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
        <div className="flex min-w-0 items-center gap-4 h-full">
          <div className="shrink-0 flex items-center h-full">
             <Skeleton className="size-10 sm:size-11 rounded-full" />
          </div>
          <div className="min-w-0 flex flex-col justify-center py-1 sm:h-full gap-1.5">
            <Skeleton className="h-3 sm:h-3.5 w-16 sm:w-20 rounded-[4px] opacity-40" />
            <Skeleton className="h-7 sm:h-9 w-48 sm:w-64 rounded-xl" />
            <Skeleton className="h-3.5 sm:h-4 w-32 sm:w-48 rounded-lg opacity-60" />
          </div>
        </div>
      </div>
    </header>
  )
}

/** Historial: lista principal primero en móvil; rail acciones a la izq. en lg (order como en página). */
export function ClientWorkoutsPageSkeleton() {
  return (
    <>
      <ClientStackPageHeaderSkeleton />
      <div
        className={`${CLIENT_DATA_PAGE_SHELL} flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start`}
        aria-busy="true"
        aria-label="Cargando historial"
      >
        <section className="order-1 flex min-w-0 flex-col gap-8 lg:order-2 lg:col-span-8">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-3 pb-6 pt-8 px-6 sm:px-8 border-b bg-muted/5">
              <div className="flex items-center gap-2">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-5 w-36 rounded-md" />
                      <Skeleton className="h-3 w-28 rounded-md opacity-60" />
                    </div>
                    <Skeleton className="h-6 w-20 shrink-0 rounded-lg" />
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside className="order-2 lg:order-1 lg:col-span-4 lg:sticky lg:top-[calc(112px+1.5rem)] lg:self-start">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex items-center gap-2">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-3 w-48 rounded-md opacity-60" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}

/** Progreso: gráficos primero en móvil; insights sticky rail en lg. */
export function ClientProgressPageSkeleton() {
  return (
    <>
      <ClientStackPageHeaderSkeleton />
      <div
        className={`${CLIENT_DATA_PAGE_SHELL} grid gap-6 lg:grid-cols-12 lg:items-start`}
        aria-busy="true"
        aria-label="Cargando progreso"
      >
        <aside className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-4 lg:sticky lg:top-[calc(112px+1.5rem)] lg:self-start">
          <Card className="overflow-hidden rounded-3xl border-border/80 shadow-sm ring-1 ring-primary/5">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </CardContent>
          </Card>
        </aside>

        <section className="order-1 flex min-w-0 flex-col gap-6 lg:order-2 lg:col-span-8">
          <div className="grid gap-6">
            <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
                <Skeleton className="h-5 w-28 rounded-md" />
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <Skeleton className="h-[220px] w-full rounded-2xl" />
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md opacity-60 mt-1.5" />
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <Skeleton className="h-[280px] w-full rounded-2xl" />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}

/** Medidas: resumen + CTA en aside; evolución en main. */
export function ClientMeasurementsPageSkeleton() {
  return (
    <>
      <ClientStackPageHeaderSkeleton />
      <div
        className={`${CLIENT_DATA_PAGE_SHELL} grid gap-6 lg:grid-cols-12 lg:items-start`}
        aria-busy="true"
        aria-label="Cargando medidas"
      >
        <aside className="flex flex-col gap-8 lg:col-span-4 lg:sticky lg:top-[calc(112px+1.5rem)] lg:self-start">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-5 pb-6 pt-8 px-6">
              <div className="flex items-start gap-4">
                <Skeleton className="size-10 shrink-0 rounded-[1.2rem]" />
                <div className="flex flex-1 flex-col gap-2.5">
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-48 rounded-md opacity-60" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 border-t border-border/40 pt-8 px-6 pb-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-20 rounded-md opacity-40 uppercase tracking-widest" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                  {i === 0 ? <Skeleton className="h-3 w-36 rounded-md opacity-60" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 lg:col-span-8">
          <Card className="overflow-hidden border-border/80 shadow-md ring-1 ring-primary/5 rounded-3xl bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4 pt-6 px-6 sm:px-8 border-b bg-muted/5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36 rounded-md" />
                  <Skeleton className="h-3 w-56 rounded-md opacity-60" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <Skeleton className="h-[280px] w-full rounded-2xl" />
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  )
}
