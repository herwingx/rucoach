"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  setScheduleOverride,
  type ScheduleOverrideType,
} from "@/app/actions/schedule-override";
import { toast } from "sonner";
import {
  FastForward,
  RotateCcw,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface RoutineDay {
  id: string;
  day_number: number;
  day_name?: string | null;
  is_rest_day?: boolean | null;
}

interface ScheduleOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientRoutineId: string;
  trainDays: RoutineDay[];
  onOverrideSet?: () => void;
}

const OPTIONS: {
  type: ScheduleOverrideType;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    type: "skip_to_next",
    icon: <FastForward className="size-5" />,
    label: "Adelantar sesión",
    description: "Saltar al siguiente día del ciclo (uno más adelante del que toca).",
  },
  {
    type: "repeat_previous",
    icon: <RotateCcw className="size-5" />,
    label: "Repetir sesión anterior",
    description: "Entrenar el mismo día que completé la última vez.",
  },
  {
    type: "choose_specific",
    icon: <CalendarDays className="size-5" />,
    label: "Elegir un día específico",
    description: "Selecciona exactamente qué día quieres entrenar hoy.",
  },
];

export function ScheduleOverrideDialog({
  open,
  onOpenChange,
  clientRoutineId,
  trainDays,
  onOverrideSet,
}: ScheduleOverrideDialogProps) {
  const [selected, setSelected] = useState<ScheduleOverrideType | null>(null);
  const [specificDayId, setSpecificDayId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!selected) return;
    if (selected === "choose_specific" && !specificDayId) {
      toast.error("Elige un día del ciclo.");
      return;
    }

    startTransition(async () => {
      const result = await setScheduleOverride({
        clientRoutineId,
        overrideType: selected,
        specificRoutineDayId:
          selected === "choose_specific" ? specificDayId : undefined,
        reason: reason.trim() || undefined,
      });

      if (result.success) {
        toast.success(
          "Cambio guardado. Tu coach fue notificado automáticamente.",
        );
        onOpenChange(false);
        onOverrideSet?.();
        // Reset
        setSelected(null);
        setSpecificDayId("");
        setReason("");
      } else {
        toast.error(result.error ?? "No se pudo guardar el cambio.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/60 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
              <CalendarDays className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Cambiar sesión de hoy
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Si no pudiste entrenar cuando tocaba, o quieres cambiar el orden,
            ajusta tu próxima sesión aquí. Tu coach recibirá un aviso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* Tipo de override */}
          {OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setSelected(opt.type)}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:bg-accent",
                selected === opt.type
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60",
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  selected === opt.type
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {opt.icon}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[12px] text-muted-foreground leading-snug">
                  {opt.description}
                </span>
              </div>
            </button>
          ))}

          {/* Selector de día específico */}
          {selected === "choose_specific" && trainDays.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Selecciona el día
              </span>
              <div className="flex flex-wrap gap-2">
                {trainDays
                  .filter((d) => !d.is_rest_day)
                  .map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSpecificDayId(d.id)}
                      className={cn(
                        "min-h-11 rounded-xl border px-4 py-2 text-xs font-semibold transition-all",
                        specificDayId === d.id
                          ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
                          : "border-border/60 bg-card hover:bg-accent"
                      )}
                    >
                      Día {d.day_number}
                      {d.day_name ? ` · ${d.day_name}` : ""}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Motivo */}
          {selected && (
            <Field>
              <FieldLabel className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <MessageSquare className="size-3" />
                Motivo para tu coach (opcional)
              </FieldLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Ayer tuve compromisos y no pude ir al gimnasio…"
                className="min-h-[72px] resize-none rounded-xl text-sm"
              />
            </Field>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected || isPending}
            className="flex-1 rounded-xl font-bold"
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Guardando…
              </>
            ) : (
              "Confirmar cambio"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
