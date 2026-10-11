"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { unstable_rethrow } from "next/navigation";
import { createNewClient } from "@/app/actions/clients";
import { toast } from "sonner";

export function NewClientForm() {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      await createNewClient(formData);
      toast.success("¡Asesorado creado correctamente!");
    } catch (error) {
      unstable_rethrow(error);
      toast.error(
        "No pudimos crear el asesorado. Revisa los datos e intenta de nuevo.",
      );
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del asesorado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Completa los datos básicos. Podrás editar objetivos y plan después.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fullName">Nombre completo *</FieldLabel>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Juan Pérez"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="juan@example.com"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Teléfono (opcional)</FieldLabel>
                <Input id="phone" name="phone" placeholder="+34 612 345 678" />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notas Internas (Admin)</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Observaciones, lesiones, preferencias (Solo visible para admin)..."
                rows={4}
                className="min-h-[100px] resize-y"
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-4 pt-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Creando..." : "Crear asesorado"}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={isPending}
            >
              <Link href="/admin/clients">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
