"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Scale, Plus } from "lucide-react";
import { toast } from "sonner";
import { addMeasurement } from "@/app/actions/measurements";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

export interface LatestMeasurementValues {
  weight?: number | null;
  body_fat_pct?: number | null;
  waist_cm?: number | null;
  hip_cm?: number | null;
  chest_cm?: number | null;
  arm_cm?: number | null;
  thigh_cm?: number | null;
}

export function AddMeasurementForm({
  latestValues,
}: {
  latestValues?: LatestMeasurementValues;
}) {
  const router = useRouter();
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordedAt, setRecordedAt] = useState(todayStr);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");
  const [thigh, setThigh] = useState("");

  const parseFiniteNumberOrUndefined = (raw: string) => {
    if (!raw) return undefined;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFiniteNumberOrUndefined(weight);
    const bf = parseFiniteNumberOrUndefined(bodyFat);
    const wc = parseFiniteNumberOrUndefined(waist);
    const h = parseFiniteNumberOrUndefined(hip);
    const c = parseFiniteNumberOrUndefined(chest);
    const a = parseFiniteNumberOrUndefined(arm);
    const t = parseFiniteNumberOrUndefined(thigh);

    if (
      w == null &&
      bf == null &&
      wc == null &&
      h == null &&
      c == null &&
      a == null &&
      t == null
    ) {
      toast.error("Ingresa al menos una medida (peso, grasa, cintura, etc.)");
      return;
    }

    setLoading(true);
    let result: Awaited<ReturnType<typeof addMeasurement>>;
    try {
      result = await addMeasurement({
        weight: w,
        body_fat_pct: bf,
        waist_cm: wc,
        hip_cm: h,
        chest_cm: c,
        arm_cm: a,
        thigh_cm: t,
        recorded_at: recordedAt || undefined,
      });
    } catch (e) {
      console.error(e);
      toast.error("Error inesperado al guardar. Intenta de nuevo.");
      return;
    } finally {
      setLoading(false);
    }

    if (result.success) {
      toast.success("¡Medida registrada correctamente!");
      setOpen(false);
      setRecordedAt(new Date().toLocaleDateString("en-CA"));
      setWeight("");
      setBodyFat("");
      setWaist("");
      setHip("");
      setChest("");
      setArm("");
      setThigh("");
      router.refresh();
    } else {
      toast.error(
        result.error || "No pudimos registrar la medida. Intenta de nuevo.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-12 rounded-2xl gap-3 shadow-md hover:shadow-lg transition-all">
          <Plus className="size-5" />
          Registrar nueva medida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Scale className="size-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Nueva Medida</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium leading-relaxed">
              Ingresa los datos del día. Solo es necesario completar las métricas que desees actualizar hoy.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field className="col-span-2">
                  <FieldLabel htmlFor="recorded_at">Fecha del registro</FieldLabel>
                  <Input
                    id="recorded_at"
                    type="date"
                    max={todayStr}
                    value={recordedAt}
                    onChange={(e) => setRecordedAt(e.target.value)}
                    required
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="weight">Peso (kg)</FieldLabel>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={
                      latestValues?.weight != null
                        ? `Último: ${latestValues.weight} kg`
                        : "70.0"
                    }
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="body_fat">% Grasa</FieldLabel>
                  <Input
                    id="body_fat"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder={
                      latestValues?.body_fat_pct != null
                        ? `Último: ${latestValues.body_fat_pct}%`
                        : "20.0"
                    }
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="waist">Cintura (cm)</FieldLabel>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={
                      latestValues?.waist_cm != null
                        ? `Último: ${latestValues.waist_cm} cm`
                        : "85"
                    }
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="hip">Cadera (cm)</FieldLabel>
                  <Input
                    id="hip"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={
                      latestValues?.hip_cm != null
                        ? `Último: ${latestValues.hip_cm} cm`
                        : "95"
                    }
                    value={hip}
                    onChange={(e) => setHip(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="chest">Pecho (cm)</FieldLabel>
                  <Input
                    id="chest"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={
                      latestValues?.chest_cm != null
                        ? `Último: ${latestValues.chest_cm} cm`
                        : "100"
                    }
                    value={chest}
                    onChange={(e) => setChest(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="arm">Brazo (cm)</FieldLabel>
                  <Input
                    id="arm"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={
                      latestValues?.arm_cm != null
                        ? `Último: ${latestValues.arm_cm} cm`
                        : "35"
                    }
                    value={arm}
                    onChange={(e) => setArm(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
                <Field className="col-span-2">
                  <FieldLabel htmlFor="thigh">Muslo (cm)</FieldLabel>
                  <Input
                    id="thigh"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={
                      latestValues?.thigh_cm != null
                        ? `Último: ${latestValues.thigh_cm} cm`
                        : "55"
                    }
                    value={thigh}
                    onChange={(e) => setThigh(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </Field>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl font-bold text-base mt-2 shadow-lg transition-all active:scale-[0.98]">
                {loading ? "Guardando envío..." : "Guardar Registro"}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
