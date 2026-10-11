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
        <Skeleton className="h-8 w-12 sm:h-9 rounded-lg" />
        <Skeleton className="h-3.5 w-24 max-w-full rounded-md opacity-50" />
      </CardContent>
    </Card>
  );
}

export default function AdminClientsLoading() {
  return (
    <div
      className="min-h-dvh bg-background"
      aria-busy="true"
      aria-label="Cargando asesorados"
    >
      <AdminPageHeaderSkeleton
        actions={<Skeleton className="h-10 w-full sm:w-40 rounded-xl" />}
      />

      <div className={ADMIN_DATA_PAGE_SHELL}>
        <div className="flex flex-col gap-6">
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <KpiTileSkeleton key={i} />
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:max-w-sm rounded-xl" />
            <div className="flex w-full flex-wrap gap-1.5 sm:w-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-9 flex-1 rounded-xl sm:h-9 sm:w-20 sm:flex-none"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="overflow-hidden border-border/60 bg-card/80 rounded-2xl shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-12 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-40 max-w-full" />
                      <Skeleton className="h-3 w-full max-w-[12rem]" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                  </div>
                  <Skeleton className="h-9 w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

