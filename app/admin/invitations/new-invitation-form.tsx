"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { createInvitationCode } from "@/app/actions/invitations";
import { UserPlus, User, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function NewInvitationForm() {
  const [forRole, setForRole] = React.useState("client");
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;

    const formData = new FormData(form);
    formData.set("for_role", forRole);

    try {
      const result = await createInvitationCode(formData);
      if (result && result.success) {
        toast.success(
          `¡Código ${result.code} generado! Cópialo y compártelo cuando quieras.`,
        );
        // The action revalidates the path, so the list below will update if this was in the same page
        // But since we want to clear the form:
        form.reset();
      } else {
        toast.error(result?.error || "No pudimos generar el código. Intenta de nuevo.");
      }
    } catch (error) {
      toast.error("No pudimos generar el código. Revisa tu conexión.");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-5" />
          Generar nuevo código
        </CardTitle>
        <CardDescription>
          Genera códigos para asesorados o para agregar otro coach al equipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] lg:items-end"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Tipo de invitación</FieldLabel>
              <Tabs
                value={forRole}
                onValueChange={(val) => val && setForRole(val)}
                className="w-full"
              >
                <ScrollArea className="w-full whitespace-nowrap">
                  <TabsList className="inline-flex w-auto bg-muted/50 p-1 h-12 rounded-2xl border border-border/40 shadow-sm">
                    <TabsTrigger
                      value="client"
                      className="rounded-xl px-4 py-2 data-[state=active]:shadow-md gap-2 text-xs sm:text-sm"
                    >
                      <User className="size-4" />
                      Cliente (asesorado)
                    </TabsTrigger>
                    <TabsTrigger
                      value="admin"
                      className="rounded-xl px-4 py-2 data-[state=active]:shadow-md gap-2 text-xs sm:text-sm"
                    >
                      <ShieldCheck className="size-4" />
                      Coach / Admin
                    </TabsTrigger>
                  </TabsList>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </Tabs>
              <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-dashed border-border/60">
                {forRole === "admin" ? (
                  <>
                    <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" aria-hidden />
                    <span>El código de coach crea otro administrador con acceso completo al panel. Úsalo con cuidado.</span>
                  </>
                ) : (
                  <>
                    <User className="size-4 shrink-0 text-primary mt-0.5" aria-hidden />
                    <span>El código de cliente permite el registro de un nuevo asesorado en tu base de datos.</span>
                  </>
                )}
              </p>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="email">Email (opcional)</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Opcional. Si lo pones, enviamos el enlace por correo.
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="expires_in_days">
                  Expira en (días)
                </FieldLabel>
                <Input
                  id="expires_in_days"
                  name="expires_in_days"
                  type="number"
                  defaultValue={30}
                  min={1}
                  max={365}
                />
              </Field>
            </div>
          </FieldGroup>

          <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Acción rápida</p>
              <p className="text-xs text-muted-foreground">
                Revisa los datos y genera el código de invitación.
              </p>
            </div>
            <Separator />
            <Button
              type="submit"
              disabled={isPending}
              className="w-full lg:w-auto lg:min-w-44 lg:self-end"
            >
              <UserPlus className="mr-2 size-4" />
              {isPending ? "Generando..." : "Generar código"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
