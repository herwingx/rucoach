"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { CreditCard, Edit2, Plus, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  type MembershipPlanRecord,
  toggleMembershipPlanActive,
  upsertMembershipPlan,
} from "@/app/actions/gym-settings";

interface MembershipPlansSettingsProps {
  initialPlans: MembershipPlanRecord[];
  currency?: string;
}

export function MembershipPlansSettings({
  initialPlans,
  currency = "MXN",
}: MembershipPlansSettingsProps) {
  const [plans, setPlans] = useState<MembershipPlanRecord[]>(initialPlans);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlanRecord | null>(
    null,
  );
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("800");
  const [durationDays, setDurationDays] = useState<string>("30");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingPlan(null);
    setName("");
    setPrice("800");
    setDurationDays("30");
    setDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (plan: MembershipPlanRecord) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(String(plan.price));
    setDurationDays(String(plan.duration_days));
    setDescription(plan.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Ingresa un nombre para el plan");
      return;
    }

    setSaving(true);
    try {
      const res = await upsertMembershipPlan({
        id: editingPlan?.id,
        name: name.trim(),
        price: Number(price) || 0,
        duration_days: Number(durationDays) || 30,
        description: description.trim() || null,
        is_active: editingPlan ? editingPlan.is_active : true,
      });

      if (!res.success || !res.plan) {
        toast.error(res.error || "No se pudo guardar el plan");
        return;
      }

      const saved = res.plan;
      setPlans((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        if (exists) {
          return prev.map((p) => (p.id === saved.id ? saved : p));
        }
        return [...prev, saved].sort((a, b) => a.price - b.price);
      });

      setDialogOpen(false);
      toast.success(
        editingPlan ? "Plan actualizado correctamente" : "Nuevo plan creado",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: MembershipPlanRecord, next: boolean) => {
    setTogglingId(plan.id);
    try {
      const res = await toggleMembershipPlanActive(plan.id, next);
      if (!res.success) {
        toast.error(res.error || "No se pudo cambiar el estado del plan");
        return;
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: next } : p)),
      );
      toast.success(
        next ? `"${plan.name}" activado` : `"${plan.name}" archivado`,
      );
    } finally {
      setTogglingId(null);
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency || "MXN",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Card className="rounded-3xl border-border/80 shadow-md ring-1 ring-primary/5">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <CreditCard className="size-5 text-primary" />
            Planes de Asesoría y Tarifas
          </CardTitle>
          <CardDescription>
            Configura los paquetes que aparecen al registrar cobros o dar de alta a tus asesorados.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={openCreateDialog}
          className="h-10 rounded-xl font-bold gap-1.5 shrink-0"
        >
          <Plus className="size-4" />
          Nuevo plan
        </Button>
      </CardHeader>

      <CardContent>
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
            <CreditCard className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-bold text-foreground">
              Aún no tienes planes configurados
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Crea tus planes (Mensual, Trimestral, Semestral, Anual) para agilizar el registro de pagos y fechas de vencimiento.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openCreateDialog}
              className="mt-4 rounded-xl"
            >
              <Plus className="mr-1.5 size-4" />
              Crear primer plan
            </Button>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 transition-all ${
                  plan.is_active
                    ? "border-border/60 bg-card/60"
                    : "border-border/40 bg-muted/20 opacity-65"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">
                          {plan.name}
                        </h3>
                        <Badge
                          variant={plan.is_active ? "secondary" : "outline"}
                          className="text-[10px] font-bold"
                        >
                          {plan.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarClock className="size-3.5 text-primary" />
                        <span>{plan.duration_days} días de vigencia</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black tabular-nums text-primary">
                        {formatMoney(plan.price)}
                      </span>
                    </div>
                  </div>
                  {plan.description ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.is_active}
                      disabled={togglingId === plan.id}
                      onCheckedChange={(checked) =>
                        handleToggleActive(plan, checked)
                      }
                      aria-label={`Activar o desactivar plan ${plan.name}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      Disponible en cobros
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(plan)}
                    className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
                  >
                    <Edit2 className="size-3.5" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              {editingPlan ? "Editar plan de asesoría" : "Nuevo plan de asesoría"}
            </DialogTitle>
            <DialogDescription>
              Define el nombre, precio y días de vigencia que se aplicarán automáticamente al registrar un pago.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel>Nombre del plan</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Plan Mensual Online"
                className="rounded-xl"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Precio ({currency})</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-xl"
                />
              </Field>
              <Field>
                <FieldLabel>Duración (días)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={730}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="rounded-xl"
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Mensual (30d)", days: "30" },
                { label: "Trimestral (90d)", days: "90" },
                { label: "Semestral (180d)", days: "180" },
                { label: "Anual (365d)", days: "365" },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDurationDays(preset.days)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    durationDays === preset.days
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <Field>
              <FieldLabel>Descripción (opcional)</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Incluye rutina personalizada, revisión quincenal y soporte por chat."
                className="min-h-[72px] rounded-xl text-sm"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl font-bold"
            >
              {saving ? "Guardando…" : "Guardar plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

