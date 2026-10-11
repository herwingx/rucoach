"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { assignRoutineToClient } from "@/app/actions/routine-assignment";
import { Check, Loader2, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AssignableClientItem {
  id: string;
  full_name: string;
  email: string | null;
  status: string | null;
  assigned_routine_id?: string | null;
  assigned_routine_name?: string | null;
}

interface AssignRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineId: string | null;
  routineName: string;
  clients: AssignableClientItem[];
  onAssigned?: (clientId: string) => void;
}

export function AssignRoutineModal({
  open,
  onOpenChange,
  routineId,
  routineName,
  clients,
  onAssigned,
}: AssignRoutineModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const handleAssign = async () => {
    if (!routineId || !selectedClientId) {
      toast.error("Selecciona un asesorado para asignar la rutina.");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignRoutineToClient(
        selectedClientId,
        routineId,
        notes.trim() || undefined,
      );
      const client = clients.find((c) => c.id === selectedClientId);
      toast.success(
        `Rutina "${routineName}" asignada a ${client?.full_name || "tu asesorado"}.`,
      );
      onAssigned?.(selectedClientId);
      setSelectedClientId("");
      setNotes("");
      setSearch("");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("No se pudo asignar la rutina. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            setSelectedClientId("");
            setNotes("");
            setSearch("");
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-4" />
            </div>
            Asignar rutina a asesorado
          </DialogTitle>
          <DialogDescription>
            Selecciona a quién deseas asignarle{" "}
            <span className="font-semibold text-foreground">
              &quot;{routineName}&quot;
            </span>
            . Se notificará automáticamente por correo y notificación push.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                No tienes asesorados registrados todavía.
              </p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar asesorado por nombre o correo..."
                  className="h-10 rounded-xl pl-10 text-sm"
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-muted/15 p-1.5 space-y-1">
                {filteredClients.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No se encontraron asesorados con ese criterio.
                  </p>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedClientId === client.id;
                    const alreadyHasThisRoutine =
                      routineId && client.assigned_routine_id === routineId;

                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                          isSelected
                            ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {client.full_name}
                            </span>
                            {alreadyHasThisRoutine && (
                              <Badge
                                variant="secondary"
                                className="h-5 rounded-full bg-emerald-500/15 px-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-0"
                              >
                                Asignada actualmente
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {client.assigned_routine_name &&
                            !alreadyHasThisRoutine
                              ? `Rutina actual: ${client.assigned_routine_name}`
                              : client.email || "Sin correo"}
                          </p>
                        </div>

                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background",
                          )}
                        >
                          {isSelected && <Check className="size-3" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="assign-routine-notes"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Notas o instrucciones para el asesorado (opcional)
                </Label>
                <Textarea
                  id="assign-routine-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Prioriza técnica en las primeras 2 semanas, mantén RIR 2..."
                  rows={2}
                  className="resize-none rounded-xl text-sm"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedClientId || isSubmitting || clients.length === 0}
            className="rounded-xl font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 size-4" />
                Confirmar asignación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

