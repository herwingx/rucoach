"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cloneRoutine } from "@/app/actions/routine-builder";
import {
  AssignRoutineModal,
  type AssignableClientItem,
} from "@/components/admin/routines/assign-routine-modal";
import { DeleteRoutineButton } from "./delete-routine-button";

interface RoutineDetailActionsProps {
  routineId: string;
  routineName: string;
  clients: AssignableClientItem[];
}

export function RoutineDetailActions({
  routineId,
  routineName,
  clients,
}: RoutineDetailActionsProps) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async () => {
    setIsCloning(true);
    try {
      const res = await cloneRoutine(routineId);
      if (res.success && res.routineId) {
        toast.success(`Rutina duplicada: "${res.name}"`);
        router.push(`/admin/routines/${res.routineId}`);
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo duplicar la rutina");
      }
    } catch {
      toast.error("Error inesperado al duplicar la rutina");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Button
          asChild
          className="h-11 flex-1 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:flex-initial"
        >
          <Link href={`/admin/routines/${routineId}/edit`}>
            <Pencil className="mr-2 size-4" />
            Editar
          </Link>
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="h-11 flex-1 rounded-xl font-semibold text-sm sm:flex-initial"
          onClick={() => setAssignOpen(true)}
        >
          <UserPlus className="mr-2 size-4" />
          Asignar
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl px-3.5 font-semibold text-sm"
          onClick={handleClone}
          disabled={isCloning}
          title="Crear una copia de esta rutina"
        >
          {isCloning ? (
            <Loader2 className="size-4 animate-spin sm:mr-2" />
          ) : (
            <Copy className="size-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Duplicar</span>
        </Button>

        <DeleteRoutineButton
          routineId={routineId}
          routineName={routineName}
        />
      </div>

      <AssignRoutineModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        routineId={routineId}
        routineName={routineName}
        clients={clients}
      />
    </>
  );
}

