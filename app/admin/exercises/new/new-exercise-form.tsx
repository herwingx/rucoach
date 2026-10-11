"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdminExercise } from "@/app/actions/exercises";
import { getR2PresignedUrl } from "@/app/actions/r2-storage";
import { R2_PUBLIC_URL } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2, Upload, Check } from "lucide-react";

const PRIMARY_MUSCLES = [
  { value: "chest", label: "Pecho" },
  { value: "back", label: "Espalda" },
  { value: "shoulders", label: "Hombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "abs", label: "Abdomen" },
  { value: "glutes", label: "Glúteos" },
  { value: "quadriceps", label: "Cuádriceps" },
  { value: "hamstrings", label: "Isquiotibiales" },
  { value: "calves", label: "Gemelos" },
  { value: "forearms", label: "Antebrazos" },
  { value: "full_body", label: "Cuerpo completo" },
  { value: "cardio", label: "Cardio" },
] as const;

const EXERCISE_TYPES = [
  { value: "strength", label: "Fuerza / hipertrofia" },
  { value: "cardio", label: "Cardio" },
  { value: "mobility", label: "Movilidad" },
  { value: "hiit", label: "HIIT" },
  { value: "stretching", label: "Estiramiento" },
] as const;

export function NewExerciseForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [primaryMuscle, setPrimaryMuscle] = useState<string>("chest");
  const [exerciseType, setExerciseType] = useState<string>("strength");

  // R2 Upload State
  const [uploadingGif, setUploadingGif] = useState(false);
  const [gifUrl, setGifUrl] = useState("");

  async function handleGifUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGif(true);
    try {
      const ext = file.name.split(".").pop() || "gif";
      const path = `exercises/${crypto.randomUUID()}.${ext}`;

      const signedUrl = await getR2PresignedUrl(path, file.type);

      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!res.ok) throw new Error("Error al subir a R2");

      const finalUrl = `${R2_PUBLIC_URL}/${path}`;
      setGifUrl(finalUrl);
      toast.success("GIF subido a R2 correctamente");
    } catch (err) {
      toast.error("Error al subir el GIF");
      console.error(err);
    } finally {
      setUploadingGif(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("primaryMuscle", primaryMuscle);
      fd.set("exerciseType", exerciseType);
      // Si tenemos URL de R2, la forzamos en el FormData
      if (gifUrl) fd.set("gifUrl", gifUrl);

      await createAdminExercise(fd);
      toast.success("Ejercicio creado");
      router.push("/admin/exercises");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="ex-name">Nombre</FieldLabel>
          <FieldDescription>
            Como lo verán en rutinas y en la app del asesorado.
          </FieldDescription>
          <FieldContent>
            <Input
              id="ex-name"
              name="name"
              required
              className="rounded-xl"
              placeholder="Ej. Press inclinado con mancuernas"
            />
          </FieldContent>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel id="ex-pm-label">Grupo principal</FieldLabel>
            <FieldDescription>
              Debe coincidir con la categoría en base de datos.
            </FieldDescription>
            <FieldContent>
              <Select value={primaryMuscle} onValueChange={setPrimaryMuscle}>
                <SelectTrigger
                  className="w-full rounded-xl"
                  aria-labelledby="ex-pm-label"
                >
                  <SelectValue placeholder="Elige" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRIMARY_MUSCLES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel id="ex-type-label">Tipo</FieldLabel>
            <FieldContent>
              <Select value={exerciseType} onValueChange={setExerciseType}>
                <SelectTrigger
                  className="w-full rounded-xl"
                  aria-labelledby="ex-type-label"
                >
                  <SelectValue placeholder="Elige" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {EXERCISE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="ex-sec">
            Músculo secundario (opcional)
          </FieldLabel>
          <FieldContent>
            <Input
              id="ex-sec"
              name="secondaryMuscle"
              className="rounded-xl"
              placeholder="Ej. Tríceps, Hombros"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ex-eq">Equipamiento (opcional)</FieldLabel>
          <FieldContent>
            <Input
              id="ex-eq"
              name="equipment"
              className="rounded-xl"
              placeholder="Ej. Mancuernas, Polea…"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ex-gif">GIF del ejercicio</FieldLabel>
          <FieldDescription>
            Sube un archivo o pega una URL directa.
          </FieldDescription>
          <FieldContent className="space-y-3">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="relative rounded-xl overflow-hidden"
                disabled={uploadingGif}
              >
                {uploadingGif ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {gifUrl ? "Cambiar GIF" : "Subir a R2"}
                <input
                  type="file"
                  accept="image/gif,image/webp"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleGifUpload}
                />
              </Button>
              {gifUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[200px]">
                  <Check className="size-3.5 text-primary shrink-0" aria-hidden />
                  <span className="truncate">{gifUrl.split("/").pop()}</span>
                </span>
              )}
            </div>
            <Input
              id="ex-gif"
              name="gifUrl"
              type="url"
              className="rounded-xl"
              placeholder="https://... o sube uno arriba"
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ex-img">
            URL imagen estática (opcional)
          </FieldLabel>
          <FieldContent>
            <Input
              id="ex-img"
              name="imageUrl"
              type="url"
              className="rounded-xl"
              placeholder="https://…"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ex-video">
            URL de vídeo demo (opcional)
          </FieldLabel>
          <FieldContent>
            <Input
              id="ex-video"
              name="demoVideoUrl"
              type="url"
              className="rounded-xl"
              placeholder="YouTube o archivo…"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="ex-notes">Técnica y notas</FieldLabel>
          <FieldDescription>
            Cues que quieras que lean coach antes de programar y el cliente en
            la ficha.
          </FieldDescription>
          <FieldContent>
            <Textarea
              id="ex-notes"
              name="techniqueNotes"
              className="min-h-28 rounded-xl"
              placeholder="Rango de movimiento, errores frecuentes, alternativas…"
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" className="rounded-xl" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Guardando…
            </>
          ) : (
            "Crear ejercicio"
          )}
        </Button>
      </div>
    </form>
  );
}
