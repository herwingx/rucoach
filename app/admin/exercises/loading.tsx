import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_DATA_PAGE_SHELL } from "@/components/admin/admin-page-header";
import { AdminPageHeaderSkeleton } from "@/components/skeletons";
import { AdminExercisesCatalogSkeleton } from "@/components/admin/exercises/admin-exercises-catalog-skeleton";

export default function AdminExercisesLoading() {
  return (
    <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Cargando catálogo de ejercicios">
      <AdminPageHeaderSkeleton
        actions={<Skeleton className="h-10 w-full sm:w-36 rounded-xl" />}
      />

      <div className={ADMIN_DATA_PAGE_SHELL}>
        <AdminExercisesCatalogSkeleton />
      </div>
    </div>
  );
}

