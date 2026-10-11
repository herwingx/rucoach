"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { updateClient } from "@/app/actions/clients";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "expired", label: "Vencido" },
  { value: "suspended", label: "Suspendido" },
  { value: "inactive", label: "Inactivo" },
  { value: "pending", label: "Pendiente" },
];

const GOALS = [
  { value: "muscle_gain", label: "Ganar masa muscular" },
  { value: "weight_loss", label: "Pérdida de grasa" },
  { value: "toning", label: "Fuerza" },
  { value: "endurance", label: "Resistencia" },
  { value: "maintenance", label: "Bienestar general" },
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

export function EditClientForm({
  client,
}: {
  client: Record<string, unknown>;
}) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState((client.status as string) || "active");
  const [gender, setGender] = useState((client.gender as string) || "");
  const [goal, setGoal] = useState((client.goal as string) || "");
  const [experienceLevel, setExperienceLevel] = useState(
    (client.experience_level as string) || "",
  );
  const birthDateStr = client.birth_date as string | undefined;
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    birthDateStr
      ? new Date(
          birthDateStr.includes("T")
            ? birthDateStr
            : `${birthDateStr}T12:00:00`,
        )
      : undefined,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set("status", status);
    formData.set("gender", gender);
    formData.set("goal", goal);
    formData.set("experienceLevel", experienceLevel);
    if (birthDate) {
      const y = birthDate.getFullYear();
      const m = String(birthDate.getMonth() + 1).padStart(2, "0");
      const d = String(birthDate.getDate()).padStart(2, "0");
      formData.set("birthDate", `${y}-${m}-${d}`);
    }

    try {
      await updateClient(client.id as string, formData);
      toast.success("¡Cambios guardados correctamente!");
    } catch (error) {
      unstable_rethrow(error);
      toast.error("No pudimos guardar los cambios. Intenta de nuevo.");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del asesorado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Actualiza la información del cliente.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Nombre completo *</FieldLabel>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={client.full_name as string}
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={client.phone as string}
                />
              </Field>
              <Field>
                <FieldLabel>Fecha de nacimiento</FieldLabel>
                <DatePicker date={birthDate} setDate={setBirthDate} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="currentWeight">
                  Peso actual (kg)
                </FieldLabel>
                <Input
                  id="currentWeight"
                  name="currentWeight"
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  defaultValue={client.current_weight as number}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="height">Altura (cm)</FieldLabel>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  step="0.1"
                  placeholder="175"
                  defaultValue={client.height as number}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="status">Estado</FieldLabel>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="gender">Género</FieldLabel>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="goal">Objetivo</FieldLabel>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger id="goal" className="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="experienceLevel">
                  Nivel de experiencia
                </FieldLabel>
                <Select
                  value={experienceLevel}
                  onValueChange={setExperienceLevel}
                >
                  <SelectTrigger id="experienceLevel" className="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notas</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client.notes as string}
                placeholder="Observaciones, lesiones, preferencias..."
                rows={4}
                className="min-h-[100px] resize-y"
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="outline" asChild disabled={isPending}>
              <Link href={`/admin/clients/${client.id}`}>Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
