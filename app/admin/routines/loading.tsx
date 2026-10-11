import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_DATA_PAGE_SHELL } from "@/components/admin/admin-page-header";
import { AdminPageHeaderSkeleton } from "@/components/skeletons";

function KpiTileSkeleton() {
  return (
    <Card className="min-w-0 overflow-visible border-border/50 shadow-sm ring-1 ring-primary/5 rounded-2xl bg-card/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start gap-3 p-4 sm:p-5 pb-2">
        <Skeleton className="size-10 shrink-0 rounded-xl" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 p-4 sm:p-5 pt-0">
        <Skeleton className="h-8 w-16 sm:h-9 rounded-lg" />
        <Skeleton className="h-3.5 w-32 max-w-full rounded-md opacity-50" />
      </CardContent>
    </Card>
  );
}

export default function AdminRoutinesLoading() {
  return (
    <div
      className="min-h-dvh bg-background"
      aria-busy="true"
      aria-label="Cargando rutinas"
    >
      <AdminPageHeaderSkeleton
        actions={<Skeleton className="h-10 w-full sm:w-40 rounded-xl" />}
      />

      <div className={ADMIN_DATA_PAGE_SHELL}>
        <section className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <KpiTileSkeleton key={i} />
          ))}
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className="overflow-hidden border-border/60 bg-card/80 rounded-2xl shadow-sm"
            >
              <CardHeader className="space-y-2 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-6 w-48 max-w-full" />
                  <Skeleton className="size-9 shrink-0 rounded-xl" />
                </div>
                <Skeleton className="h-4 w-full max-w-xs" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-xl" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

