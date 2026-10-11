"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMeasurement } from "@/app/actions/measurements";

export type MeasurementHistoryRow = {
  id: string;
  recorded_at: string;
  weight: number | null;
  waist_cm: number | null;
  body_fat_pct: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
};

function parseRecordedDate(dateStr: string): Date {
  return new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
}

export function MeasurementsHistoryList({
  measurements,
}: {
  measurements: MeasurementHistoryRow[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedDesc = [...measurements].sort(
    (a, b) =>
      parseRecordedDate(b.recorded_at).getTime() -
      parseRecordedDate(a.recorded_at).getTime(),
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteMeasurement(id);
      if (res.success) {
        toast.success("Registro eliminado correctamente");
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo eliminar el registro");
      }
    } catch {
      toast.error("Error inesperado al eliminar el registro");
    } finally {
      setDeletingId(null);
    }
  };

  if (sortedDesc.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Aún no hay registros en tu historial.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {sortedDesc.map((row) => {
        const dateFormatted = parseRecordedDate(
          row.recorded_at,
        ).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const badges: { label: string; value: string }[] = [];
        if (row.weight != null)
          badges.push({ label: "Peso", value: `${row.weight} kg` });
        if (row.waist_cm != null)
          badges.push({ label: "Cintura", value: `${row.waist_cm} cm` });
        if (row.body_fat_pct != null)
          badges.push({ label: "% Grasa", value: `${row.body_fat_pct}%` });
        if (row.chest_cm != null)
          badges.push({ label: "Pecho", value: `${row.chest_cm} cm` });
        if (row.hip_cm != null)
          badges.push({ label: "Cadera", value: `${row.hip_cm} cm` });
        if (row.arm_cm != null)
          badges.push({ label: "Brazo", value: `${row.arm_cm} cm` });
        if (row.thigh_cm != null)
          badges.push({ label: "Muslo", value: `${row.thigh_cm} cm` });

        const isDeleting = deletingId === row.id;

        return (
          <div
            key={row.id}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <CalendarDays
                  className="size-3.5 text-primary shrink-0"
                  aria-hidden
                />
                <span className="capitalize">{dateFormatted}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <Badge
                    key={b.label}
                    variant="secondary"
                    className="rounded-lg px-2 py-0.5 text-[11px] font-medium"
                  >
                    <span className="text-muted-foreground mr-1">
                      {b.label}:
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {b.value}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    className="h-8 gap-1.5 rounded-xl text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar registro del ${dateFormatted}`}
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    <span className="sm:sr-only">Eliminar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminará permanentemente la medición registrada el{" "}
                      <span className="font-semibold text-foreground">
                        {dateFormatted}
                      </span>
                      . Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(row.id)}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar registro
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
